from django.test import TestCase
from django.contrib.auth.models import User
from django.urls import reverse
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from models import UserProfile
from django.core.files.uploadedfile import SimpleUploadedFile

# Create a bunch of users
class MassRegistrationTest(TestCase):

    def test_register_150_users(self):
        url = reverse("register")

        for i in range(150):
            data = {
                "username": f"user{i}",
                "email": f"user{i}@example.com",
                "password": "test1234"
            }
            response = self.client.post(url, data)
            self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        self.assertEqual(User.objects.count(), 150)
        self.assertEqual(UserProfile.objects.count(), 150)
