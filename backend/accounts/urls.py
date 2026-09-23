from django.urls import path
from rest_framework.routers import SimpleRouter

from .views import AccountViewSet, TransactionViewSet

router = SimpleRouter(trailing_slash=False)
router.register("accounts", AccountViewSet, basename="account")

transaction_list = TransactionViewSet.as_view({"get": "list", "post": "create"})
transaction_detail = TransactionViewSet.as_view(
    {"get": "retrieve", "patch": "partial_update", "delete": "destroy"}
)

urlpatterns = router.urls + [
    path(
        "accounts/<str:account_id>/transactions",
        transaction_list,
        name="account-transaction-list",
    ),
    path(
        "accounts/<str:account_id>/transactions/<str:pk>",
        transaction_detail,
        name="account-transaction-detail",
    ),
]
