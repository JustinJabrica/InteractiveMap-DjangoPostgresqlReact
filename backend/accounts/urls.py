"""
URL configuration for accounts app.
"""

from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    RegisterView,
    CustomLoginView,
    LogoutView,
    CurrentUserView,
    DeleteAccountView,
    PasswordChangeView,
    ProfileView,
    ProfilePictureView,
    UserListView
)

urlpatterns = [
    # Authentication
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', CustomLoginView.as_view(), name='login'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token-refresh'),

    # User management
    path('me/', CurrentUserView.as_view(), name='current-user'),
    path('delete/', DeleteAccountView.as_view(), name='delete-account'),
    path('change-password/', PasswordChangeView.as_view(), name='change-password'),

    # Profile
    path('profile/', ProfileView.as_view(), name='profile'),
    path('profile/picture/', ProfilePictureView.as_view(), name='profile-picture'),

    # User search (for sharing)
    path('users/', UserListView.as_view(), name='user-list'),
]