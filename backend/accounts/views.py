"""
Implements user registration, authentication, profile management.
"""
from django.core.exceptions import ObjectDoesNotExist
from rest_framework import generics, status, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from rest_framework.authtoken.views import ObtainAuthToken
from rest_framework.parsers import MultiPartParser, FormParser
from django.contrib.auth.models import User
from django.contrib.auth import logout

from .models import UserProfile
from .serializers import (
    UserSerializer,
    UserRegistrationSerializer,
    UserUpdateSerializer,
    UserProfileSerializer,
    PasswordChangeSerializer,
    ProfilePictureSerializer
)

class RegisterView(generics.CreateAPIView):
    #Register a new user. POST /api/accounts/register

    queryset = User.objects.all()
    serializer_class = UserRegistrationSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        print(request.data)
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        token, created = Token.objects.get_or_create(user=user)
        return Response({
            'user': UserSerializer(user).data,
            'token': token.key,
            'message': 'User registered successfully.'
        }, status=status.HTTP_201_CREATED)


class CustomLoginView(ObtainAuthToken):
    #Login and get token. POST /api/accounts/login
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        token, created = Token.objects.get_or_create(user=user)
        return Response({
            'user': UserSerializer(user).data,
            'token': token.key,
        })


class LogoutView(APIView):
    """Logout and delete token. POST /api/accounts/logout"""
    permission_classes = [permissions.IsAuthenticated]

    @staticmethod
    def post(request):
        try:
            request.user.auth_token.delete()
        except (AttributeError, ObjectDoesNotExist):
            pass
        logout(request)
        return Response(
            {'message': 'Successfully logged out'},
            status=status.HTTP_200_OK
        )


class CurrentUserView(generics.RetrieveAPIView):
    """Get or Update the current user. POST /api/accounts/me"""
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user

    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return UserUpdateSerializer
        return UserSerializer


class DeleteAccountView(APIView):
    """Delete current user's account. POST /api/accounts/delete"""

    permission_classes = [permissions.IsAuthenticated]

    @staticmethod
    def delete(request):
        user = request.user
        try:
            request.user.auth_token.delete()
        except (AttributeError, ObjectDoesNotExist):
            pass
        user.delete()
        return Response(
            {'message': 'Successfully deleted'},
            status=status.HTTP_204_NO_CONTENT
        )


class PasswordChangeView(APIView):
    """Change password. POST /api/accounts/change_password"""
    permission_classes = [permissions.IsAuthenticated]

    @staticmethod
    def post(request):
        serializer = PasswordChangeSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = request.user
        if not user.check_password(serializer.validated_data['old_password']):
            return Response(
                {'old_password': 'Old password incorrect'},
                status=status.HTTP_400_BAD_REQUEST
            )

        user.set_password(serializer.validated_data['new_password'])
        user.save()

        Token.objects.filter(user=user).delete()
        token = Token.objects.create(user=user)

        return Response(
            {'message': 'Successfully changed password', 'token': token.key},
            status=status.HTTP_200_OK
        )


class ProfileView(generics.RetrieveUpdateAPIView):
    """
    Get or update user profile.
    GET /api/accounts/profile/
    PUT/PATCH /api/accounts/profile/
    """
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def get_object(self):
        return self.request.user.profile


class ProfilePictureView(generics.RetrieveAPIView):
    """
    Upload or delete profile picture.
    POST /api/accounts/profile/picture/
    DELETE /api/accounts/profile/picture/
    """
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    @staticmethod
    def post(request):
        profile = request.user.profile
        serializer = ProfilePictureSerializer(profile, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)

        """Delete old picture if it exists"""
        if profile.profile_picture:
            profile.profile_picture.delete(save=False)

        serializer.save()
        return Response(
            {'message': 'Successfully updated profile', 'profile': UserProfileSerializer(profile).data},
            status=status.HTTP_200_OK
        )

    @staticmethod
    def delete(request):
        profile = request.user.profile
        if profile.profile_picture:
            profile.profile_picture.delete(save=True)
            return Response({'message': 'Successfully deleted profile picture'}, status=status.HTTP_200_OK)
        return Response({'message': 'No profile picture found'}, status=status.HTTP_404_NOT_FOUND)


class UserListView(generics.ListAPIView):
    """List all users to share maps lollllll. GET /api/accounts/users"""
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = User.objects.exclude(id=self.request.user.id)
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(username__icontains=search)
        return queryset
