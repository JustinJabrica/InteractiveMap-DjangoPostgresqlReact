"""
Models for the accounts app.
"""

from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save, pre_save, pre_delete
from django.dispatch import receiver


def profile_picture_path(instance, filename):
    """Generate upload path for profile pictures."""
    return f'profile_pictures/user_{instance.user.id}/{filename}'


class UserProfile(models.Model):
    """Extended user profile with additional information."""
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='profile'
    )
    profile_picture = models.ImageField(
        upload_to=profile_picture_path,
        null=True,
        blank=True
    )
    bio = models.TextField(max_length=500, blank=True)
    location = models.CharField(max_length=100, blank=True)
    website = models.URLField(max_length=200, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username}'s Profile"


# Signal to create UserProfile when User is created
@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        UserProfile.objects.create(user=instance)


@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    if hasattr(instance, 'profile'):
        instance.profile.save()


# Signal to delete old profile picture when a new one is uploaded
@receiver(pre_save, sender=UserProfile)
def delete_old_profile_picture(sender, instance, **kwargs):
    if not instance.pk:
        return  # New instance, no old file to delete

    try:
        old_instance = UserProfile.objects.get(pk=instance.pk)
    except UserProfile.DoesNotExist:
        return

    old_file = old_instance.profile_picture
    new_file = instance.profile_picture

    # If there was an old file and it's different from the new one, delete it
    if old_file and old_file != new_file:
        old_file.delete(save=False)


# Signal to delete profile picture when profile is deleted
@receiver(pre_delete, sender=UserProfile)
def delete_profile_picture_on_delete(sender, instance, **kwargs):
    if instance.profile_picture:
        instance.profile_picture.delete(save=False)