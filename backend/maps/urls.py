"""
URL configuration for maps app.
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    MapViewSet,
    MapLayerViewSet,
    PointOfInterestViewSet,
    SharedMapViewSet,
    SharedWithMeView,
    PublicMapsView,
    MyMapsView
)

router = DefaultRouter()
router.register(r'maps', MapViewSet, basename='map')
router.register(r'layers', MapLayerViewSet, basename='layer')
router.register(r'pois', PointOfInterestViewSet, basename='poi')
router.register(r'shared', SharedMapViewSet, basename='shared')

urlpatterns = [
    path('', include(router.urls)),
    path('shared-with-me/', SharedWithMeView.as_view(), name='shared-with-me'),
    path('public/', PublicMapsView.as_view(), name='public-maps'),
    path('my-maps/', MyMapsView.as_view(), name='my-maps'),
]