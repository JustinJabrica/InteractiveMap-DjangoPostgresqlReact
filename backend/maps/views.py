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


class MapViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Map model.
    Full CRUD: list, create, retrieve, update, destroy
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

    def perform_destroy(self, instance):
        # Only owner can delete
        if instance.owner != self.request.user:
            raise PermissionError("You do not have permission to delete this map.")
        instance.delete()

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

    @action(detail=True, methods=['post'])
    def share(self, request, pk=None):
        """Share a map with another user."""
        map_obj = self.get_object()
        if map_obj.owner != request.user:
            return Response(
                {"error": "Only the owner can share this map."},
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
    """
    serializer_class = MapLayerSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'order', 'created_at']
    ordering = ['order', 'name']

    def get_queryset(self):
        user = self.request.user
        # Get layers from owned maps, shared maps with edit permission, and public maps (view only)
        owned_map_ids = Map.objects.filter(owner=user).values_list('id', flat=True)
        editable_shared_map_ids = SharedMap.objects.filter(
            shared_with=user,
            permission__in=['edit', 'admin']
        ).values_list('map_id', flat=True)
        public_map_ids = Map.objects.filter(is_public=True).values_list('id', flat=True)

        queryset = MapLayer.objects.filter(
            Q(map_id__in=owned_map_ids) | Q(map_id__in=editable_shared_map_ids) | Q(map_id__in=public_map_ids)
        )

        # Filter by map if provided
        map_id = self.request.query_params.get('map', None)
        if map_id:
            queryset = queryset.filter(map_id=map_id)

        return queryset

    def create(self, request, *args, **kwargs):
        # Verify user has permission to add layers to this map
        map_id = request.data.get('map')
        map_obj = get_object_or_404(Map, id=map_id)

        if map_obj.owner != request.user:
            shared = SharedMap.objects.filter(
                map=map_obj,
                shared_with=request.user,
                permission__in=['edit', 'admin']
            ).exists()
            if not shared:
                return Response(
                    {"error": "You do not have permission to add layers to this map."},
                    status=status.HTTP_403_FORBIDDEN
                )

        return super().create(request, *args, **kwargs)


class PointOfInterestViewSet(viewsets.ModelViewSet):
    """
    ViewSet for PointOfInterest model.
    Full CRUD: list, create, retrieve, update, destroy
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
        # Verify user has permission to add POIs to this map
        map_id = request.data.get('map')
        map_obj = get_object_or_404(Map, id=map_id)

        if map_obj.owner != request.user:
            shared = SharedMap.objects.filter(
                map=map_obj,
                shared_with=request.user,
                permission__in=['edit', 'admin']
            ).exists()
            if not shared:
                return Response(
                    {"error": "You do not have permission to add points to this map."},
                    status=status.HTTP_403_FORBIDDEN
                )

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
        instance = self.get_object()
        # Only map owner or the shared_with user can remove the share
        if instance.map.owner != request.user and instance.shared_with != request.user:
            return Response(
                {"error": "You do not have permission to remove this share."},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().destroy(request, *args, **kwargs)

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        # Only map owner can update permissions
        if instance.map.owner != request.user:
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