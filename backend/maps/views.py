"""
Views for the maps app.
Implements full CRUD operations for all map-related models.
"""

from rest_framework import viewsets, generics, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.db.models import Q
from django.shortcuts import get_object_or_404

from .models import Map, MapLayer, PointOfInterest, SharedMap
from .serializers import (
    MapSerializer,
    MapListSerializer,
    MapUpdateSerializer,
    MapLayerSerializer,
    PointOfInterestSerializer,
    PointOfInterestListSerializer,
    SharedMapSerializer,
    SharedMapUpdateSerializer
)


def get_user_map_permission(user, map_obj):
    """
    Get the user's permission level for a map.
    Returns: 'owner', 'admin', 'edit', 'view', or None
    """
    if user.is_superuser:
        return 'owner'  # Superusers have owner-level access
    if map_obj.owner == user:
        return 'owner'

    shared = SharedMap.objects.filter(map=map_obj, shared_with=user).first()
    if shared:
        return shared.permission

    if map_obj.is_public and not (user.is_superuser or (map_obj.owner == user)):
        return 'view'

    return None


class MapViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Map model.
    Full CRUD: list, create, retrieve, update, destroy

    Permissions:
    - owner/superuser: full access (edit, delete, share, manage permissions)
    - admin: can edit map, add/edit/delete POIs, share (but not change permissions)
    - edit: can edit map, add/edit POIs, share (but not change permissions)
    - view: read only
    """
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'created_at', 'updated_at']
    ordering = ['-updated_at']

    def get_serializer_class(self):
        if self.action == 'list':
            return MapListSerializer
        if self.action in ['update', 'partial_update']:
            return MapUpdateSerializer
        return MapSerializer

    def get_queryset(self):
        user = self.request.user
        # Include owned maps, shared maps, and public maps
        owned_maps = Map.objects.filter(owner=user)
        shared_map_ids = SharedMap.objects.filter(shared_with=user).values_list('map_id', flat=True)
        shared_maps = Map.objects.filter(id__in=shared_map_ids)
        public_maps = Map.objects.filter(is_public=True)
        return (owned_maps | shared_maps | public_maps).distinct()

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        permission = get_user_map_permission(request.user, instance)

        if permission not in ['owner', 'admin', 'edit']:
            return Response(
                {"error": "You do not have permission to edit this map."},
                status=status.HTTP_403_FORBIDDEN
            )

        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        permission = get_user_map_permission(request.user, instance)

        # Only owner and superuser can delete
        if permission != 'owner':
            return Response(
                {"error": "Only the map owner can delete this map."},
                status=status.HTTP_403_FORBIDDEN
            )

        return super().destroy(request, *args, **kwargs)

    @action(detail=True, methods=['get'])
    def pois(self, request, pk=None):
        """Get all POIs for a map with sorting options."""
        map_obj = self.get_object()
        pois = map_obj.points_of_interest.all()

        # Sorting options
        sort_by = request.query_params.get('sort_by', 'created_at')
        sort_order = request.query_params.get('order', 'desc')

        if sort_by == 'name':
            pois = pois.order_by('name' if sort_order == 'asc' else '-name')
        elif sort_by == 'layer':
            pois = pois.order_by('layer__name' if sort_order == 'asc' else '-layer__name')
        elif sort_by == 'updated_at':
            pois = pois.order_by('updated_at' if sort_order == 'asc' else '-updated_at')
        else:  # created_at
            pois = pois.order_by('created_at' if sort_order == 'asc' else '-created_at')

        serializer = PointOfInterestListSerializer(pois, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def layers(self, request, pk=None):
        """Get all layers for a map."""
        map_obj = self.get_object()
        layers = map_obj.layers.all()
        serializer = MapLayerSerializer(layers, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def user_permission(self, request, pk=None):
        """Get the current user's permission level for this map."""
        map_obj = self.get_object()
        permission = get_user_map_permission(request.user, map_obj)
        return Response({
            'permission': permission,
            'can_edit': permission in ['owner', 'admin', 'edit'],
            'can_delete_map': permission == 'owner',
            'can_add_poi': permission in ['owner', 'admin', 'edit'],
            'can_edit_poi': permission in ['owner', 'admin', 'edit'],
            'can_delete_poi': permission in ['owner', 'admin'],
            'can_share': permission in ['owner', 'admin', 'edit'],
            'can_manage_shares': permission == 'owner',
        })

    @action(detail=True, methods=['post'])
    def share(self, request, pk=None):
        """Share a map with another user."""
        map_obj = self.get_object()
        permission = get_user_map_permission(request.user, map_obj)

        # edit, admin, and owner can share
        if permission not in ['owner', 'admin', 'edit']:
            return Response(
                {"error": "You do not have permission to share this map."},
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = SharedMapSerializer(data={**request.data, 'map': map_obj.id}, context={'request': request})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['get'])
    def shared_users(self, request, pk=None):
        """Get list of users this map is shared with."""
        map_obj = self.get_object()
        shared = SharedMap.objects.filter(map=map_obj)
        serializer = SharedMapSerializer(shared, many=True)
        return Response(serializer.data)


class MapLayerViewSet(viewsets.ModelViewSet):
    """
    ViewSet for MapLayer model.
    Layers act as map-specific categories for organizing POIs.
    Full CRUD: list, create, retrieve, update, destroy

    Permissions:
    - owner/superuser: full access
    - admin: can add, edit, delete layers
    - edit: can add, edit layers (no delete)
    - view: read only
    """
    serializer_class = MapLayerSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'order', 'created_at']
    ordering = ['order', 'name']

    def get_queryset(self):
        user = self.request.user
        # Get layers from owned maps, shared maps, and public maps
        owned_map_ids = Map.objects.filter(owner=user).values_list('id', flat=True)
        shared_map_ids = SharedMap.objects.filter(shared_with=user).values_list('map_id', flat=True)
        public_map_ids = Map.objects.filter(is_public=True).values_list('id', flat=True)

        queryset = MapLayer.objects.filter(
            Q(map_id__in=owned_map_ids) | Q(map_id__in=shared_map_ids) | Q(map_id__in=public_map_ids)
        )

        # Filter by map if provided
        map_id = self.request.query_params.get('map', None)
        if map_id:
            queryset = queryset.filter(map_id=map_id)

        return queryset

    def create(self, request, *args, **kwargs):
        """Create layer - requires edit or admin permission."""
        map_id = request.data.get('map')
        map_obj = get_object_or_404(Map, id=map_id)
        permission = get_user_map_permission(request.user, map_obj)

        if permission not in ['owner', 'admin', 'edit']:
            return Response(
                {"error": "You do not have permission to add layers to this map."},
                status=status.HTTP_403_FORBIDDEN
            )

        return super().create(request, *args, **kwargs)

    def update(self, request, *args, **kwargs):
        """Update layer - requires edit or admin permission."""
        instance = self.get_object()
        permission = get_user_map_permission(request.user, instance.map)

        if permission not in ['owner', 'admin', 'edit']:
            return Response(
                {"error": "You do not have permission to edit layers on this map."},
                status=status.HTTP_403_FORBIDDEN
            )

        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        """Delete layer - requires admin or owner permission."""
        instance = self.get_object()
        permission = get_user_map_permission(request.user, instance.map)

        if permission not in ['owner', 'admin']:
            return Response(
                {"error": "You do not have permission to delete layers on this map."},
                status=status.HTTP_403_FORBIDDEN
            )

        return super().destroy(request, *args, **kwargs)


class PointOfInterestViewSet(viewsets.ModelViewSet):
    """
    ViewSet for PointOfInterest model.
    Full CRUD: list, create, retrieve, update, destroy

    Permissions:
    - owner/superuser: full access
    - admin: can add, edit, delete POIs
    - edit: can add, edit POIs (no delete)
    - view: read only
    """
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'created_at', 'updated_at', 'layer__name']
    ordering = ['-created_at']

    def get_serializer_class(self):
        if self.action == 'list':
            return PointOfInterestListSerializer
        return PointOfInterestSerializer

    def get_queryset(self):
        user = self.request.user
        # Get POIs from owned maps, shared maps, and public maps
        owned_map_ids = Map.objects.filter(owner=user).values_list('id', flat=True)
        shared_map_ids = SharedMap.objects.filter(shared_with=user).values_list('map_id', flat=True)
        public_map_ids = Map.objects.filter(is_public=True).values_list('id', flat=True)

        queryset = PointOfInterest.objects.filter(
            Q(map_id__in=owned_map_ids) | Q(map_id__in=shared_map_ids) | Q(map_id__in=public_map_ids)
        )

        # Filter by map if provided
        map_id = self.request.query_params.get('map', None)
        if map_id:
            queryset = queryset.filter(map_id=map_id)

        # Filter by layer if provided
        layer_id = self.request.query_params.get('layer', None)
        if layer_id:
            queryset = queryset.filter(layer_id=layer_id)

        return queryset

    def create(self, request, *args, **kwargs):
        """Create POI - requires edit or admin permission."""
        map_id = request.data.get('map')
        map_obj = get_object_or_404(Map, id=map_id)
        permission = get_user_map_permission(request.user, map_obj)

        if permission not in ['owner', 'admin', 'edit']:
            return Response(
                {"error": "You do not have permission to add points to this map."},
                status=status.HTTP_403_FORBIDDEN
            )

        return super().create(request, *args, **kwargs)

    def update(self, request, *args, **kwargs):
        """Update POI - requires edit or admin permission."""
        instance = self.get_object()
        permission = get_user_map_permission(request.user, instance.map)

        if permission not in ['owner', 'admin', 'edit']:
            return Response(
                {"error": "You do not have permission to edit points on this map."},
                status=status.HTTP_403_FORBIDDEN
            )

        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        """Delete POI - requires admin or owner permission."""
        instance = self.get_object()
        permission = get_user_map_permission(request.user, instance.map)

        if permission not in ['owner', 'admin']:
            return Response(
                {"error": "You do not have permission to delete points on this map."},
                status=status.HTTP_403_FORBIDDEN
            )

        return super().destroy(request, *args, **kwargs)

        return super().create(request, *args, **kwargs)

    @action(detail=False, methods=['get'])
    def by_layer(self, request):
        """Get POIs grouped by layer for a specific map."""
        map_id = request.query_params.get('map', None)
        if not map_id:
            return Response(
                {"error": "Map ID is required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        queryset = self.get_queryset().filter(map_id=map_id)
        layers = MapLayer.objects.filter(map_id=map_id)

        result = []
        for layer in layers:
            pois = queryset.filter(layer=layer)
            result.append({
                'layer': MapLayerSerializer(layer).data,
                'points_of_interest': PointOfInterestListSerializer(pois, many=True).data
            })

        # Include POIs without a layer
        no_layer = queryset.filter(layer__isnull=True)
        if no_layer.exists():
            result.append({
                'layer': None,
                'points_of_interest': PointOfInterestListSerializer(no_layer, many=True).data
            })

        return Response(result)


class SharedMapViewSet(viewsets.ModelViewSet):
    """
    ViewSet for SharedMap model.
    Full CRUD for managing map sharing.

    Permissions:
    - owner/superuser: can add shares, update permissions, remove shares
    - admin/edit: can add shares only
    - view: no sharing permissions
    """
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.action in ['update', 'partial_update']:
            return SharedMapUpdateSerializer
        return SharedMapSerializer

    def get_queryset(self):
        user = self.request.user
        # Show shares where user is the owner of the map or the recipient
        return SharedMap.objects.filter(
            Q(map__owner=user) | Q(shared_with=user)
        )

    def destroy(self, request, *args, **kwargs):
        """Remove a share - only owner/superuser can remove shares."""
        instance = self.get_object()
        permission = get_user_map_permission(request.user, instance.map)

        if permission != 'owner':
            return Response(
                {"error": "Only the map owner can remove shared users."},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().destroy(request, *args, **kwargs)

    def update(self, request, *args, **kwargs):
        """Update permissions - only owner/superuser can change permissions."""
        instance = self.get_object()
        permission = get_user_map_permission(request.user, instance.map)

        if permission != 'owner':
            return Response(
                {"error": "Only the map owner can update sharing permissions."},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().update(request, *args, **kwargs)


class SharedWithMeView(generics.ListAPIView):
    """
    List all maps shared with the current user.
    GET /api/maps/shared-with-me/
    """
    serializer_class = MapListSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        shared_map_ids = SharedMap.objects.filter(
            shared_with=self.request.user
        ).values_list('map_id', flat=True)
        return Map.objects.filter(id__in=shared_map_ids)


class PublicMapsView(generics.ListAPIView):
    """
    List all public maps (excluding user's own maps).
    GET /api/maps/public/
    """
    serializer_class = MapListSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Return public maps, excluding the user's own maps
        return Map.objects.filter(is_public=True).exclude(owner=self.request.user)


class MyMapsView(generics.ListAPIView):
    """
    List only maps owned by the current user.
    GET /api/maps/my-maps/
    """
    serializer_class = MapListSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Map.objects.filter(owner=self.request.user)