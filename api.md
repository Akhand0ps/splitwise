
```
POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/me

POST   /api/groups
GET    /api/groups
GET    /api/groups/:groupId
POST   /api/groups/:groupId/members
DELETE /api/groups/:groupId/members/:userId
DELETE /api/groups/:groupId/leave

POST   /api/expenses
GET    /api/expenses/group/:groupId
GET    /api/expenses/:expenseId
DELETE /api/expenses/:expenseId

POST   /api/settlements
GET    /api/settlements/group/:groupId
PATCH  /api/settlements/:settlementId/complete

GET    /api/balances/group/:groupId
GET    /api/balances/me