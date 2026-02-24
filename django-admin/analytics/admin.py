from django.contrib import admin
from .models import User, Group, GroupMember, Expense, ExpenseSplit, Settlement

@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display  = ('id', 'name', 'email', 'phone', 'createdAt')
    search_fields = ('name', 'email')
    exclude       = ('password',)  # never show hashed password


@admin.register(Group)
class GroupAdmin(admin.ModelAdmin):
    list_display  = ('id', 'name', 'description', 'createdAt')
    search_fields = ('name',)


@admin.register(GroupMember)
class GroupMemberAdmin(admin.ModelAdmin):
    list_display  = ('id', 'user', 'group', 'role', 'createdAt')
    list_filter   = ('role',)


@admin.register(Expense)
class ExpenseAdmin(admin.ModelAdmin):
    list_display  = ('id', 'description', 'amount', 'split_type', 'group', 'paid_by', 'createdAt')
    list_filter   = ('split_type', 'group')
    search_fields = ('description',)


@admin.register(ExpenseSplit)
class ExpenseSplitAdmin(admin.ModelAdmin):
    list_display  = ('id', 'expense', 'user', 'amount')


@admin.register(Settlement)
class SettlementAdmin(admin.ModelAdmin):
    list_display  = ('id', 'from_user', 'to_user', 'amount', 'status', 'group', 'createdAt')
    list_filter   = ('status',)