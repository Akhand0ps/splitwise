from django.urls import path


from . import views

urlpatterns = [
    path('summary/',views.summary,name = 'summary'),
    path('top-spenders/',views.top_spenders,name='top_spenders'),
    path('group-activity/',views.group_activity,name="group_activity"),
    path('unsettled-debts/',views.unsettled_debts,name = 'unsettled_debts')
]