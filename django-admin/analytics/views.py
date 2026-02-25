from django.shortcuts import render

# Create your views here.
from django.db.models import Sum,Count,Avg
from django.db.models.functions import TruncMonth
from .models import User,Expense,Settlement,Group
from datetime import datetime,timedelta
from django.http import JsonResponse

def summary(request):
    total_users = User.objects.count()
    total_groups = Group.objects.count()
    total_expenses = Expense.objects.count()


    total_amount = Expense.objects.aggregate(
        total = Sum('amount')
    )['total'] or 0

    pending_settlements = Settlement.objects.filter(status= 'PENDING').aggregate(
        total = Sum('amount'),
        count = Count('id')
    )

    completed_settlements = Settlement.objects.filter(status='COMPLETED').aggregate(
        total = Sum('amount'),
        count = Count('id')
    )

    #ab lst ke 30 din ke nikl le , bss
    last_30_days = datetime.now() - timedelta(days=30)

    recent_expenses = Expense.objects.filter(createdAt__gte=last_30_days).aggregate(
        total = Sum('amount'),
        count = Count('id')
    )

    return JsonResponse({
        'users':total_users,
        'groups':total_groups,
        'expenses':{
            'count':total_expenses,
            'total_amount':float(total_amount),
            'last_30_days':{
                'count':recent_expenses['count'],
                'amount':float(recent_expenses['total'] or 0)
            }
        },
        'settlements':{
            'pending':{
                'count':pending_settlements['count'],
                'amount':float(pending_settlements['total'] or 0)
            },
            'completed':{
                'count':completed_settlements['count'],
                'amount':float(completed_settlements['total'] or 0)
            }
        }
    })


def top_spenders(request):

    #kisne se jyda pay kiya 
    limit = int(request.GET.get('limit',10))

    spenders = User.objects.annotate(
        total_paid = Sum('expenses_paid__amount'),
        expense_count = Count('expenses_paid')
    ).filter(
        total_paid__isnull = False
    ).order_by('-total_paid')[:limit]

    data = [
        {
            'user':{
                'id':u.id,
                'name':u.name,
                'email':u.email
            },
            'total_paid':float(u.total_paid),
            'expense_count': u.expense_count
        }
        for u in spenders
    ]
    return JsonResponse({
        'top_spenders':data
    })


def group_activity(request):
    #sbse jyda active grup konsa hai , expense coutn and total amoutn jyda hoga

    limit = int(request.GET.get('limit',10))
    groups = Group.objects.annotate(
        expense_count = Count('expense'),
        total_amount = Sum('expense__amount'),
        member_count = Count('groupmember')
    ).filter(
        expense_count__gt =00
    ).order_by('-total_amount')[:limit]

    data = [
        {
            'group':{
                'id':g.id,
                'name':g.name
            },
            'expense_count':g.expense_count,

            'total_amount':float(g.total_amount or 0),
            'member_count':g.member_count
        }
        for g in groups
    ]

    return JsonResponse({
        'groups':data
    })

def unsettled_debts(request):

    limit = int(request.GET.get('limit',20))

    pending = Settlement.objects.filter(
        status='PENDING'
    ).select_related(
        'from_user','to_user','group'
    ).order_by('-amount')[:limit]

    data = [
        {
            'id':s.id,
            'from':{'id':s.from_user.id,'name':s.from_user.name},
            'to':{'id':s.to_user.id,'name':s.to_user.name},
            'amount':float(s.amount),
            'group':{'id':s.group.id,'name':s.group.name} if s.group else None,
            'note':s.note,
            'since':s.createdAt.isoformat()
        }
        for s in pending
    ]

    total_pending = Settlement.objects.filter(status = 'PENDING').aggregate(
        total = Sum('amount')
    )['total'] or 0

    return JsonResponse({
        'total_pending_amount':float(total_pending),
        'settlements':data
    })