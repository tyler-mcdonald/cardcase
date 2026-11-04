from django.urls import path

from .views import DemoStartView

urlpatterns = [
    path("demo/start", DemoStartView.as_view(), name="demo-start"),
]
