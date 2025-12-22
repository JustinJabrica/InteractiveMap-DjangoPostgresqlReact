"""
Admin configuration for maps app.
"""

from django.contrib import admin
from .models import Map, MapLayer, PointOfInterest, SharedMap


class MapLayerInline(admin.TabularInline):
    model = MapLayer
    extra = 0


class PointOfInterestInline(admin.TabularInline):
    model = PointOfInterest
    extra = 0
    readonly_fields = ['created_by', 'created_at']


class SharedMapInline(admin.TabularInline):
    model = SharedMap
    extra = 0
    fk_name = 'map'
    readonly_fields = ['shared_by', 'created_at']


@admin.register(Map)
class MapAdmin(admin.ModelAdmin):
    list_display = ['name', 'owner', 'file_type', 'is_public', 'poi_count', 'created_at']
    list_filter = ['owner', 'file_type', 'is_public', 'created_at']
    search_fields = ['name', 'description', 'owner__username']
    readonly_fields = ['created_at', 'updated_at', 'poi_count']
    inlines = [MapLayerInline, PointOfInterestInline, SharedMapInline]


@admin.register(MapLayer)
class MapLayerAdmin(admin.ModelAdmin):
    list_display = ['name', 'map', 'color', 'is_visible', 'order', 'poi_count', 'created_at']
    list_filter = ['map', 'is_visible', 'created_at']
    search_fields = ['name', 'description', 'map__name']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(PointOfInterest)
class PointOfInterestAdmin(admin.ModelAdmin):
    list_display = ['name', 'map', 'layer', 'created_by', 'created_at']
    list_filter = ['map', 'layer', 'created_at']
    search_fields = ['name', 'description', 'map__name', 'layer__name']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(SharedMap)
class SharedMapAdmin(admin.ModelAdmin):
    list_display = ['map', 'shared_with', 'shared_by', 'permission', 'created_at']
    list_filter = ['permission', 'created_at']
    search_fields = ['map__name', 'shared_with__username', 'shared_by__username']
    readonly_fields = ['created_at', 'updated_at']