//@ts-ignore
export const calculateBalances = (expenses,settlements)=>{

    const balance = {}

     // Step 1: Process expenses -> expenses ko process kr
    for(const expense of expenses){

        const payerId = expense.paidById;

        // payer gets credit for full amount -> payer me apan amount credit krege like akhand ne pay kiya 500 toh +500 hoga sirf mere me
        //@ts-ignore
        balance[payerId] = (balance[payerId] || 0) + Number(expense.amount);

         // each split person gets debited -> ab jab mere pe sara credit hua expense , ab jo mere group me dusre log hai , unme debit hoga which will lead to -negtive balances
        for(const split of expense.splits){
            //@ts-ignore
            balance[split.userId] = (balance[split.userId] || 0) - Number(split.amount);
        }
    }

    //sb settlement apply kro

    for(const s of settlements){

        if(s.status === 'COMPLETED'){
            //@ts-ignore
            balance[s.fromUserId] = (balance[s.fromUserId] || 0) + Number(s.amount);
            //@ts-ignore
            balance[s.toUserId] = (balance[s.toUserId] || 0) + Number(s.amount);
        }
    }
    return balance;
}

//@ts-ignore
export const simplifyDebts = (balances)=>{

    const transactions = [];


    const debtors = [];
    const creditors = [];

    for(const [userId,amount] of Object.entries(balances)){
        //@ts-ignore
        if(amount < -0.01){
            debtors.push({
                userId: Number(userId),
                //@ts-ignore
                amount: -amount
            });
        }
        //@ts-ignore
        else if(amount > -0.01){

            creditors.push({
                userId: Number(userId),
                //@ts-ignore
                amount: +amount
            })
        }
    }


    let i=0;
    let j = 0;


    while(i < debtors.length && j < debtors.length){
        const debtor = debtors[i];
        const creditor = creditors[j];

        const settled  = Math.min(debtor.amount,creditor.amount);

        transactions.push({
            from: debtor.userId,
            to: creditor.userId,
            amount: Math.round(settled*100)/100    //2 palace round krde
        })

        debtor.amount -= settled;
        creditor.amount += settled;

        if(debtor.amount <0.01)i++;
        if(creditor.amount < 0.01)j++;
    }

    return transactions;

}