"""
Models for the maps app.
Implements Map, Category, MapLayer, PointOfInterest, and SharedMap models.
"""

from django.db import models
from django.contrib.auth.models import User


def map_file_path(instance, filename):
    return f'maps/user_{instance.owner.id}/{filename}'


class Category(models.Model):
    """Category model for organizing points of interest."""
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    color = models.CharField(max_length=7, default='#3498db')  # Hex color
    icon = models.CharField(max_length=50, default='marker')  # Icon name
    owner = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='categories'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = 'Categories'
        ordering = ['name']
        unique_together = ['name', 'owner']  # Unique category name per user

    def __str__(self):
        return f"{self.name} ({self.owner.username})"


class Map(models.Model):
    """Map model for storing uploaded map images or PDFs."""
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    file = models.FileField(upload_to=map_file_path)
    file_type = models.CharField(max_length=10)  # 'image' or 'pdf'
    owner = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='maps'
    )
    width = models.IntegerField(null=True, blank=True)  # For positioning POIs
    height = models.IntegerField(null=True, blank=True)
    is_public = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-updated_at']

    def __str__(self):
        return f"{self.name} - {self.owner.username}"

    def delete(self, *args, **kwargs):
        # Delete file when map is deleted
        if self.file:
            self.file.delete(save=False)
        super().delete(*args, **kwargs)

    @property
    def poi_count(self):
        return self.points_of_interest.count()


class MapLayer(models.Model):
    """MapLayer model for grouping points of interest into toggleable layers."""
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    color = models.CharField(max_length=7, default='#2ecc71')  # Hex color
    map = models.ForeignKey(
        Map,
        on_delete=models.CASCADE,
        related_name='layers'
    )
    is_visible = models.BooleanField(default=True)
    order = models.IntegerField(default=0)  # For layer ordering
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['order', 'name']
        unique_together = ['name', 'map']

    def __str__(self):
        return f"{self.name} - {self.map.name}"

    @property
    def poi_count(self):
        return self.points_of_interest.count()


class PointOfInterest(models.Model):
    """PointOfInterest model for marking locations on maps."""
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    map = models.ForeignKey(
        Map,
        on_delete=models.CASCADE,
        related_name='points_of_interest'
    )
    category = models.ForeignKey(
        Category,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='points_of_interest'
    )
    layer = models.ForeignKey(
        MapLayer,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='points_of_interest'
    )
    # Position on the map (percentage-based for responsiveness)
    x_position = models.DecimalField(max_digits=6, decimal_places=3)  # 0.000 to 100.000
    y_position = models.DecimalField(max_digits=6, decimal_places=3)
    # Optional custom styling
    icon = models.CharField(max_length=50, blank=True)
    color = models.CharField(max_length=7, blank=True)
    created_by = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='created_pois'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Point of Interest'
        verbose_name_plural = 'Points of Interest'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.name} on {self.map.name}"


class SharedMap(models.Model):
    """SharedMap model for sharing maps with other users."""
    PERMISSION_CHOICES = [
        ('view', 'View Only'),
        ('edit', 'Can Edit'),
        ('admin', 'Admin'),
    ]

    map = models.ForeignKey(
        Map,
        on_delete=models.CASCADE,
        related_name='shared_with'
    )
    shared_with = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='shared_maps'
    )
    shared_by = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='maps_shared'
    )
    permission = models.CharField(
        max_length=10,
        choices=PERMISSION_CHOICES,
        default='view'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['map', 'shared_with']
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.map.name} shared with {self.shared_with.username}"