from django.urls import include, path
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from . import views

router = DefaultRouter()
router.register(r'categories', views.CategoryViewSet, basename='category')
router.register(r'expenses', views.ExpenseViewSet, basename='expense')

urlpatterns = [
    path('auth/register/', views.RegisterView.as_view(), name='register'),
    path('auth/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path(
        'auth/token/refresh/',
        TokenRefreshView.as_view(),
        name='token_refresh',
    ),
    path('', include(router.urls)),
]
