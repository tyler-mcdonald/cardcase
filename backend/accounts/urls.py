from django.urls import path
from rest_framework.routers import SimpleRouter

from .views import AccountViewSet, TransactionViewSet, UserTransactionViewSet

router = SimpleRouter(trailing_slash=False)
router.register("accounts", AccountViewSet, basename="account")

transaction_list = TransactionViewSet.as_view({"get": "list", "post": "create"})
transaction_detail = TransactionViewSet.as_view(
    {"get": "retrieve", "patch": "partial_update", "delete": "destroy"}
)

user_transaction_list = UserTransactionViewSet.as_view({"get": "list"})

urlpatterns = router.urls + [
    path("transactions", user_transaction_list, name="transaction-list"),
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
