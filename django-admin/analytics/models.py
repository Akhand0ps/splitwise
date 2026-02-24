from django.db import models

# Create your models here.

class User(models.Model):
    name = models.CharField(max_length=255)
    email = models.CharField(max_length=255,unique=True)
    phone = models.CharField(max_length=50,null=True,blank=True)
    password = models.CharField(max_length=255)
    createdAt = models.DateTimeField()
    updatedAt = models.DateTimeField()

    class Meta:
        managed = False,
        db_table = 'users'
    
    def __str__(self):
        return f"{self.name} ({self.email})"


class Group(models.Model):
    name = models.CharField(max_length=255)
    description = models.TextField(null=True,blank=True)
    createdAt = models.DateTimeField()
    updatedAt = models.DateField()

    class Meta:
        managed = False,
        db_table = 'groups'
    
    def __str__(self):
        return self.name


class GroupMember(models.Model):
    user = models.ForeignKey(User,on_delete=models.DO_NOTHING,db_column='userId')
    group = models.ForeignKey(Group,on_delete=models.DO_NOTHING,db_column='groupId')
    role = models.CharField(max_length=20)
    createdAt = models.DateTimeField()

    class Meta:
        managed = False
        db_table = 'group_members'
    
    def __str__(self):
        return f"{self.user.name} in {self.group.name} ({self.role})"

class Expense(models.Model):
    description = models.TextField(null=True,blank=True)
    amount = models.DecimalField(max_digits=10,decimal_places=2)
    split_type = models.CharField(max_length=20,db_column='splitType')
    group = models.ForeignKey(Group,on_delete=models.DO_NOTHING,db_column='groupId')
    paid_by = models.ForeignKey(User,on_delete=models.DO_NOTHING,related_name='expenses_paid',db_column='paidById')
    createdAt = models.DateTimeField()
    updatedAt = models.DateTimeField()

    class Meta:
        managed = False
        db_table = 'expenses'
    
    def __str__(self):
        return f"{self.description or 'Expense'} - ₹{self.amount}"
    

class ExpenseSplit(models.Model):
    expense = models.ForeignKey(Expense, on_delete=models.DO_NOTHING, db_column='expenseId')
    user = models.ForeignKey(User, on_delete=models.DO_NOTHING, db_column='userId')
    amount = models.DecimalField(max_digits=10, decimal_places=2)

    class Meta:
        managed = False
        db_table = 'expense_splits'
    
    def __str__(self):
        return f"{self.user.name} owes ₹{self.amount}"
    


class Settlement(models.Model):
    from_user = models.ForeignKey(User,on_delete=models.DO_NOTHING,related_name='settlements_paid',db_column='fromUserId')
    to_user = models.ForeignKey(User,on_delete=models.DO_NOTHING,related_name='settlements_received',db_column='toUserId')
    group = models.ForeignKey(Group,on_delete=models.DO_NOTHING,null=True,blank=True,db_column='groupId')
    amount = models.DecimalField(max_digits=10,decimal_places=2)
    status = models.CharField(max_length=20)
    note = models.TextField(null=True,blank=True)
    createdAt = models.DateTimeField()
    updatedAt = models.DateTimeField()


    class Meta:
        managed=False
        db_table = 'settlements'
    
    def __str__(self):
        return f"{self.from_user.name} -> {self.to_user.name} ₹{self.amount} ({self.status})"