"""
Views for the accounts app.
Implements user registration, authentication, profile management.
"""

from rest_framework import generics, status, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.contrib.auth.models import User
from django.contrib.auth import logout

from .models import UserProfile
from .serializers import (
    UserSerializer,
    UserRegistrationSerializer,
    UserUpdateSerializer,
    UserProfileSerializer,
    PasswordChangeSerializer,
    ProfilePictureSerializer,
    MyTokenObtainPairSerializer
)

def get_tokens(user):
    """Generate JWT tokens."""
    refresh = RefreshToken.for_user(user)
    return {
        'refresh': str(refresh),
        'access': str(refresh.access_token),
    }

class RegisterView(generics.CreateAPIView):
    """
    Register a new user.
    POST /api/accounts/register/
    """
    queryset = User.objects.all()
    serializer_class = UserRegistrationSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        tokens, created = get_tokens(user)
        return Response({
            'user': UserSerializer(user).data,
            'tokens': tokens,
            'message': 'User registered successfully.'
        }, status=status.HTTP_201_CREATED)


class CustomLoginView(TokenObtainPairView):
    """
    Login and get auth token.
    POST /api/accounts/login/
    """
    serializer_class = MyTokenObtainPairSerializer

    # permission_classes = [permissions.AllowAny]
    #
    # def post(self, request, *args, **kwargs):
    #     serializer = self.serializer_class(data=request.data, context={'request': request})
    #     serializer.is_valid(raise_exception=True)
    #     user = serializer.validated_data['user']
    #     tokens, created = MyTokenObtainPairSerializer(user)
    #     return Response({
    #         'user': UserSerializer(user).data,
    #         'tokens': tokens.tokens,
    #     })


class LogoutView(APIView):
    """
    Logout user and delete token.
    POST /api/accounts/logout/
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data['refresh']
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()
        except:
            pass
        # logout(request)
        return Response({'message': 'Successfully logged out.'}, status=status.HTTP_200_OK)


class CurrentUserView(generics.RetrieveUpdateAPIView):
    """
    Get or update current user.
    GET /api/accounts/me/
    PUT/PATCH /api/accounts/me/
    """
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user

    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return UserUpdateSerializer
        return UserSerializer


class DeleteAccountView(APIView):
    """
    Delete current user's account.
    DELETE /api/accounts/delete/
    """
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request):
        user = request.user
        try:
            request.user.auth_token.delete()
        except:
            pass
        user.delete()
        return Response({'message': 'Account deleted successfully.'}, status=status.HTTP_204_NO_CONTENT)


class PasswordChangeView(APIView):
    """
    Change user's password.
    POST /api/accounts/change-password/
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = PasswordChangeSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = request.user
        if not user.check_password(serializer.validated_data['old_password']):
            return Response(
                {'old_password': 'Current password is incorrect.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        user.set_password(serializer.validated_data['new_password'])
        user.save()

        # Update token
        tokens = get_tokens(user)

        return Response({
            'message': 'Password changed successfully.',
            'tokens': tokens,
        }, status=status.HTTP_200_OK)


# class ProfileView(generics.RetrieveUpdateAPIView):
    """
    Get or update user profile.
    GET /api/accounts/profile/
    PUT/PATCH /api/accounts/profile/
    """

class ProfileView(generics.RetrieveUpdateAPIView):

    serializer_class = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_object(self):
        return self.request.user.profile


class ProfilePictureView(APIView):
    """
    Upload or delete profile picture.
    POST /api/accounts/profile/picture/
    DELETE /api/accounts/profile/picture/
    """
    """import os

file_path = "demofile.txt"

if os.path.exists(file_path):
    os.remove(file_path)
    print(f"File '{file_path}' has been deleted.")
else:
    print(f"File '{file_path}' does not exist.")
    
    gotta implement.  Also with the maps.
"""

    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        profile = request.user.profile
        serializer = ProfilePictureSerializer(profile, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)

        # Delete old picture if exists
        if profile.profile_picture:
            profile.profile_picture.delete(save=False)

        serializer.save()
        return Response({
            'message': 'Profile picture updated successfully.',
            'profile': UserProfileSerializer(profile).data
        }, status=status.HTTP_200_OK)

    def delete(self, request):
        profile = request.user.profile
        if profile.profile_picture:
            profile.profile_picture.delete(save=True)
            return Response({'message': 'Profile picture deleted successfully.'}, status=status.HTTP_200_OK)
        return Response({'message': 'No profile picture to delete.'}, status=status.HTTP_404_NOT_FOUND)


class UserListView(generics.ListAPIView):
    """
    List/search users (for sharing maps).
    GET /api/accounts/users/?search=term
    """
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Exclude current user
        queryset = User.objects.exclude(id=self.request.user.id)

        # Search by username or email
        search = self.request.query_params.get('search', None)
        if search:
            from django.db.models import Q
            queryset = queryset.filter(
                Q(username__icontains=search) |
                Q(email__icontains=search) |
                Q(first_name__icontains=search) |
                Q(last_name__icontains=search)
            )

        # Limit results to prevent large queries
        return queryset[:20]