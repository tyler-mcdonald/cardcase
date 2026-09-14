from rest_framework.routers import SimpleRouter

from .views import AccountViewSet

router = SimpleRouter(trailing_slash=False)
router.register("accounts", AccountViewSet, basename="account")

urlpatterns = router.urls
