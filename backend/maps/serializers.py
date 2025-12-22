"""
Serializers for the maps app.
"""

from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Category, Map, MapLayer, PointOfInterest, SharedMap


class UserMinimalSerializer(serializers.ModelSerializer):
    """Minimal user serializer for nested representations."""

    class Meta:
        model = User
        fields = ['id', 'username', 'email']


class CategorySerializer(serializers.ModelSerializer):
    """Serializer for Category model."""
    poi_count = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = ['id', 'name', 'description', 'color', 'icon', 'poi_count', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']

    def get_poi_count(self, obj):
        return obj.points_of_interest.count()

    def create(self, validated_data):
        validated_data['owner'] = self.context['request'].user
        return super().create(validated_data)


class MapLayerSerializer(serializers.ModelSerializer):
    """Serializer for MapLayer model."""
    poi_count = serializers.ReadOnlyField()

    class Meta:
        model = MapLayer
        fields = ['id', 'name', 'description', 'color', 'map', 'is_visible', 'order', 'poi_count', 'created_at',
                  'updated_at']
        read_only_fields = ['created_at', 'updated_at']


class PointOfInterestSerializer(serializers.ModelSerializer):
    """Serializer for PointOfInterest model."""
    category = CategorySerializer(read_only=True)
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(),
        source='category',
        write_only=True,
        required=False,
        allow_null=True
    )
    layer = MapLayerSerializer(read_only=True)
    layer_id = serializers.PrimaryKeyRelatedField(
        queryset=MapLayer.objects.all(),
        source='layer',
        write_only=True,
        required=False,
        allow_null=True
    )
    created_by = UserMinimalSerializer(read_only=True)

    class Meta:
        model = PointOfInterest
        fields = [
            'id', 'name', 'description', 'map', 'category', 'category_id',
            'layer', 'layer_id', 'x_position', 'y_position', 'icon', 'color',
            'created_by', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at', 'created_by']

    def create(self, validated_data):
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data)


class PointOfInterestListSerializer(serializers.ModelSerializer):
    """Lighter serializer for listing POIs."""
    category_name = serializers.CharField(source='category.name', read_only=True, allow_null=True)
    category_color = serializers.CharField(source='category.color', read_only=True, allow_null=True)
    layer_name = serializers.CharField(source='layer.name', read_only=True, allow_null=True)

    class Meta:
        model = PointOfInterest
        fields = [
            'id', 'name', 'description', 'map', 'category_name', 'category_color',
            'layer_name', 'x_position', 'y_position', 'icon', 'color',
            'created_at', 'updated_at'
        ]


class SharedMapSerializer(serializers.ModelSerializer):
    """Serializer for SharedMap model."""
    shared_with = UserMinimalSerializer(read_only=True)
    shared_with_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(),
        source='shared_with',
        write_only=True
    )
    shared_by = UserMinimalSerializer(read_only=True)
    map_name = serializers.CharField(source='map.name', read_only=True)

    class Meta:
        model = SharedMap
        fields = ['id', 'map', 'map_name', 'shared_with', 'shared_with_id', 'shared_by', 'permission', 'created_at',
                  'updated_at']
        read_only_fields = ['created_at', 'updated_at', 'shared_by']

    def create(self, validated_data):
        validated_data['shared_by'] = self.context['request'].user
        return super().create(validated_data)

    def validate(self, data):
        # Can't share with yourself
        if data['shared_with'] == self.context['request'].user:
            raise serializers.ValidationError("You cannot share a map with yourself.")
        # Check if already shared
        if SharedMap.objects.filter(map=data['map'], shared_with=data['shared_with']).exists():
            raise serializers.ValidationError("This map is already shared with this user.")
        return data


class MapListSerializer(serializers.ModelSerializer):
    """Serializer for listing maps (minimal data)."""
    owner = UserMinimalSerializer(read_only=True)
    poi_count = serializers.ReadOnlyField()
    layer_count = serializers.SerializerMethodField()

    class Meta:
        model = Map
        fields = ['id', 'name', 'description', 'file', 'file_type', 'owner', 'is_public', 'poi_count', 'layer_count',
                  'created_at', 'updated_at']

    def get_layer_count(self, obj):
        return obj.layers.count()


class MapSerializer(serializers.ModelSerializer):
    """Full serializer for Map model."""
    owner = UserMinimalSerializer(read_only=True)
    layers = MapLayerSerializer(many=True, read_only=True)
    points_of_interest = PointOfInterestListSerializer(many=True, read_only=True)
    shared_with = SharedMapSerializer(many=True, read_only=True)
    poi_count = serializers.ReadOnlyField()

    class Meta:
        model = Map
        fields = [
            'id', 'name', 'description', 'file', 'file_type', 'owner',
            'width', 'height', 'is_public', 'layers', 'points_of_interest',
            'shared_with', 'poi_count', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at', 'owner', 'file_type']

    def create(self, validated_data):
        validated_data['owner'] = self.context['request'].user

        # Determine file type
        file = validated_data.get('file')
        if file:
            content_type = file.content_type
            if 'pdf' in content_type:
                validated_data['file_type'] = 'pdf'
            else:
                validated_data['file_type'] = 'image'

        return super().create(validated_data)


class MapUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating map details (without file)."""

    class Meta:
        model = Map
        fields = ['name', 'description', 'width', 'height', 'is_public']