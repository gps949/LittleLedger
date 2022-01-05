var express = require('express');
const xlsx = require('xlsx')
var fs = require('fs');
var app = express();
var bodyParser = require('body-parser');

var username = "";
var pwd = "";
var args = process.argv.splice(2);
args.forEach(function(v,i,a){
    if (v.substring(0,9)=="USERNAME=")
        username = v.substring(9);
    if (v.substring(0,9)=="PASSWORD=")
        pwd = v.substring(9);
});
function authentication(req, res, next) {
    var authheader = req.headers.authorization;
    if (!authheader) {
        var err = new Error('身份未认证');
        res.setHeader('WWW-Authenticate', 'Basic');
        err.status = 401;
        return next(err)
    }
    var auth = new Buffer.from(authheader.split(' ')[1],'base64').toString().split(':');
    var user = auth[0];
    var pass = auth[1];
    if (user == username && pass == pwd) {
        console.log('身份认证成功');
        next();
    } else {
        var err = new Error('身份未认证');
        res.setHeader('WWW-Authenticate', 'Basic');
        err.status = 401;
        return next(err);
    }
}
if (pwd!="")
    app.use(authentication);

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use("/imgs", express.static("imgs"))
app.use("/ledgers", express.static("ledgers"))

app.set("view engine", "ejs");

//创建账本
function checkLedger(current_file_name, last_file_name) {
    if (!fs.existsSync(current_file_name)) {
        if (fs.existsSync(last_file_name)) {
            console.log("账本不存在，从上月账本创建 " + current_file_name);
            fs.copyFileSync(last_file_name, current_file_name);
            console.log("创建成功");
        }
        else {
            console.log("账本不存在，从模板创建 " + current_file_name);
            fs.copyFileSync("./templates/ledger.xlsx", current_file_name);
            /*
            var wb = xlsx.utils.book_new();
            wb.SheetNames.push("资金账户", "负债账户", "动账种类");
            xlsx.writeFile(wb, current_file_name, { cellDates: true });
            */
            console.log("创建成功");
            /*
            wb = xlsx.readFile(current_file_name, { cellDates: true });
            xlsx.utils.sheet_add_aoa(wb.Sheets["资金账户"], [["用途", "备注"]], { origin: "B1" });
            xlsx.utils.sheet_add_aoa(wb.Sheets["负债账户"], [["用途", "备注"]], { origin: "B1" });
            xlsx.utils.sheet_add_aoa(wb.Sheets["资金账户"], [["月初余额"], ["当前余额"]], { origin: "A2" });
            xlsx.utils.sheet_add_aoa(wb.Sheets["负债账户"], [["月初余债"], ["当前余债"]], { origin: "A2" });
            xlsx.utils.sheet_add_aoa(wb.Sheets["动账种类"], [["支出类型", "收入类型", "转账类型"]], { origin: "A1" });
            xlsx.writeFile(wb, current_file_name, { cellDates: true });
            */
        }
    }
}

app.get('/', function (req, res) {
    var now_date = new Date();
    var year = now_date.getFullYear();
    var month = now_date.getMonth();
    var last_file_name = "./ledgers/" + (month == 0 ? year - 1 : year) + "_" + (month == 0 ? 12 : month) + ".xlsx";
    var current_file_name = "./ledgers/" + year + "_" + (month + 1) + ".xlsx";
    checkLedger(current_file_name, last_file_name);
    var expensesList = getExpenseTypeList(current_file_name);
    var incomeList = getIncomeTypeList(current_file_name);
    var transferList = getTransferTypeList(current_file_name);
    var accountList = getAccountList(current_file_name);

    var resParam = {}
    resParam.currentLedger = current_file_name.substring(current_file_name.lastIndexOf("/") + 1);
    resParam.loadMsg = "";
    resParam.loadTab = "expenses_tab";
    resParam.all_expenses_type = expensesList;
    resParam.all_income_type = incomeList;
    resParam.all_transfer_type = transferList;
    resParam.all_account = accountList;

    res.render("index", resParam);
});

app.post('/', function (req, res) {
    var now_date = new Date();
    var year = now_date.getFullYear();
    var month = now_date.getMonth();
    var last_file_name = "./ledgers/" + year + "_" + (month == 0 ? 12 : month) + ".xlsx";
    var current_file_name = "./ledgers/" + year + "_" + (month + 1) + ".xlsx";
    checkLedger(current_file_name, last_file_name);
    var expensesList = getExpenseTypeList(current_file_name);
    var incomeList = getIncomeTypeList(current_file_name);
    var transferList = getTransferTypeList(current_file_name);
    var accountList = getAccountList(current_file_name);

    var resParam = {}
    resParam.currentLedger = current_file_name.substring(current_file_name.lastIndexOf("/") + 1);
    resParam.loadMsg = "";
    resParam.loadTab = "expenses_tab";
    resParam.all_expenses_type = expensesList;
    resParam.all_income_type = incomeList;
    resParam.all_transfer_type = transferList;
    resParam.all_account = accountList;

    if (!(req.body.addAssets === undefined)) {
        var result = addAssets(current_file_name, req.body.assets_account_name, req.body.assets_account_value);
        resParam.loadTab = "settings_tab";
        if (result === "OK") {
            resParam.loadMsg = "成功添加资金账户！";
        } else if (result === "Duplicate") {
            resParam.loadMsg = "ERROR：资金账户已存在！";
        }
        res.render("index", resParam);
    } else if (!(req.body.addDebt === undefined)) {
        var result = addDebt(current_file_name, req.body.debt_account_name, req.body.debt_account_value);
        resParam.loadTab = "settings_tab";
        if (result === "OK") {
            resParam.loadMsg = "成功添加负债账户！";
        } else if (result === "Duplicate") {
            resParam.loadMsg = "ERROR：负债账户已存在！";
        }
        res.render("index", resParam);
    } else if (!(req.body.addReason === undefined)) {
        var result = addReason(current_file_name, req.body.reason_name, req.body.reason_sort);
        resParam.loadTab = "settings_tab";
        if (result === "OK") {
            resParam.loadMsg = "成功添加动账类型！";
        } else if (result === "Duplicate") {
            resParam.loadMsg = "ERROR：动账类型已存在！";
        }
        res.render("index", resParam);
    } else if (!(req.body.addExpenses === undefined)) {
        var result = addExpenses(current_file_name, req.body.expenses_value, req.body.expenses_comments, req.body.expenses_type, req.body.expenses_account);
        resParam.loadTab = "expenses_tab";
        if (result === "OK") {
            resParam.loadMsg = "成功记录支出！";
        } else if (result === "OUTSTOCK") {
            resParam.loadMsg = "ERROR：资金账户余额不足！";
        } else if (result === "NoAccount") {
            resParam.loadMsg = "ERROR：所选支出账户不存在！";
        }
        res.render("index", resParam);
    } else if (!(req.body.addIncome === undefined)) {
        var result = addIncome(current_file_name, req.body.income_value, req.body.income_comments, req.body.income_type, req.body.income_account);
        resParam.loadTab = "income_tab";
        if (result === "OK") {
            resParam.loadMsg = "成功记录收入！";
        } else if (result === "NoAccount") {
            resParam.loadMsg = "ERROR：所选支出账户不存在！";
        }
        res.render("index", resParam);
    } else if (!(req.body.addTransfer === undefined)) {
        var result = addTransfer(current_file_name, req.body.transfer_value, req.body.transfer_comments, req.body.transfer_type, req.body.transfer_out, req.body.transfer_in);
        resParam.loadTab = "transfer_tab";
        if (result === "OK") {
            resParam.loadMsg = "成功记录转账！";
        } else if (result === "NoOutAccount") {
            resParam.loadMsg = "ERROR：所选转出账户不存在！";
        } else if (result === "NoInAccount") {
            resParam.loadMsg = "ERROR：所选转入账户不存在！";
        } else if (result === "OUTSTOCK") {
            resParam.loadMsg = "ERROR：转出资金账户余额不足！";
        }
        res.render("index", resParam);
    }


});

function getExpenseTypeList(current_file_name) {
    var expenses_list = [];
    var wb = xlsx.readFile(current_file_name, { cellDates: true });
    var sheet = wb.Sheets["动账种类"];
    var rowNo = 2;
    var expensesType = sheet["A" + rowNo] ? sheet["A" + rowNo].v : "";
    while (expensesType != "") {
        expenses_list.push(expensesType);
        rowNo++;
        expensesType = sheet["A" + rowNo] ? sheet["A" + rowNo].v : "";
    }
    return expenses_list;

}
function getIncomeTypeList(current_file_name) {
    var income_list = [];
    var wb = xlsx.readFile(current_file_name, { cellDates: true });
    var sheet = wb.Sheets["动账种类"];
    var rowNo = 2;
    var incomeType = sheet["B" + rowNo] ? sheet["B" + rowNo].v : "";
    while (incomeType != "") {
        income_list.push(incomeType);
        rowNo++;
        incomeType = sheet["B" + rowNo] ? sheet["B" + rowNo].v : "";
    }
    return income_list;

}
function getTransferTypeList(current_file_name) {
    var transfer_list = [];
    var wb = xlsx.readFile(current_file_name, { cellDates: true });
    var sheet = wb.Sheets["动账种类"];
    var rowNo = 2;
    var transferType = sheet["C" + rowNo] ? sheet["C" + rowNo].v : "";
    while (transferType != "") {
        transfer_list.push(transferType);
        rowNo++;
        transferType = sheet["C" + rowNo] ? sheet["C" + rowNo].v : "";
    }
    return transfer_list;

}

function getAccountList(current_file_name) {
    var account_list = [];
    var wb = xlsx.readFile(current_file_name, { cellDates: true });
    var assetsSheet = wb.Sheets["资金账户"];
    var colNo = 3;
    var colName = xlsx.utils.encode_col(colNo);
    var cellAddr = colName + "1";
    var accountName = assetsSheet[cellAddr] ? assetsSheet[cellAddr].v : "";
    while (accountName != "") {
        account_list.push(accountName);
        colNo++;
        colName = xlsx.utils.encode_col(colNo);
        cellAddr = colName + "1";
        accountName = assetsSheet[cellAddr] ? assetsSheet[cellAddr].v : "";
    }
    var debtSheet = wb.Sheets["负债账户"];
    colNo = 3;
    colName = xlsx.utils.encode_col(colNo);
    cellAddr = colName + "1";
    accountName = debtSheet[cellAddr] ? debtSheet[cellAddr].v : "";
    while (accountName != "") {
        account_list.push(accountName);
        colNo++;
        colName = xlsx.utils.encode_col(colNo);
        cellAddr = colName + "1";
        accountName = debtSheet[cellAddr] ? debtSheet[cellAddr].v : "";
    }
    return account_list;

}

function addAssets(current_file_name, assets_account_name, assets_account_value) {
    var wb = xlsx.readFile(current_file_name, { cellDates: true });
    var assetsSheet = wb.Sheets["资金账户"];
    var colNo = 3;
    var colName = xlsx.utils.encode_col(colNo);
    var cellAddr = colName + "1";
    var accountNameCell = assetsSheet[cellAddr] ? assetsSheet[cellAddr].v : "";
    while (accountNameCell != "" && accountNameCell != assets_account_name) {
        colNo++;
        colName = xlsx.utils.encode_col(colNo);
        cellAddr = colName + "1";
        accountNameCell = assetsSheet[cellAddr] ? assetsSheet[cellAddr].v : "";
    }

    if (accountNameCell != assets_account_name) {
        xlsx.utils.sheet_add_aoa(assetsSheet, [[assets_account_name], [assets_account_value], [assets_account_value]], { origin: cellAddr });
        wb.Sheets["资金账户"][colName + "2"].t = "n";
        wb.Sheets["资金账户"][colName + "3"] = { t: "n", v: assets_account_value, F: colName + "3:" + colName + "3", f: colName + "2+" + "SUM(" + colName + "4 :" + colName + "1000)" };
        xlsx.writeFile(wb, current_file_name, { cellDates: true });
        console.log("新增资金账户名：" + assets_account_name + "\n新增资金账户初始资金：" + assets_account_value + "\n");
        return ("OK");
    } else {
        console.log("资金账户名已存在！");
        return ("Duplicate");
    }
}

function addDebt(current_file_name, debt_account_name, debt_account_value) {
    var wb = xlsx.readFile(current_file_name, { cellDates: true });
    var debtSheet = wb.Sheets["负债账户"];
    var colNo = 3;
    var colName = xlsx.utils.encode_col(colNo);
    var cellAddr = colName + "1";
    var accountNameCell = debtSheet[cellAddr] ? debtSheet[cellAddr].v : "";
    debt_account_value = "-" + debt_account_value;
    while (accountNameCell != "" && accountNameCell != debt_account_name) {
        colNo++;
        colName = xlsx.utils.encode_col(colNo);
        cellAddr = colName + "1";
        accountNameCell = debtSheet[cellAddr] ? debtSheet[cellAddr].v : "";
    }
    if (accountNameCell != debt_account_name) {
        xlsx.utils.sheet_add_aoa(debtSheet, [[debt_account_name], [debt_account_value], [debt_account_value]], { origin: cellAddr });
        wb.Sheets["负债账户"][colName + "2"].t = "n";
        wb.Sheets["负债账户"][colName + "3"] = { t: "n", v: debt_account_value, F: colName + "3:" + colName + "3", f: colName + "2+" + "SUM(" + colName + "4 :" + colName + "1000)" };
        xlsx.writeFile(wb, current_file_name, { cellDates: true });
        console.log("新增负债账户名：" + debt_account_name + "\n新增负债账户初始债务：" + debt_account_value + "\n");
        return ("OK");
    } else {
        console.log("负债账户名已存在！");
        return ("Duplicate");
    }
}

function addReason(current_file_name, reason_name, reason_sort) {
    var wb = xlsx.readFile(current_file_name, { cellDates: true });
    var reasonSheet = wb.Sheets["动账种类"];
    var rowNo = 1;
    var colName = xlsx.utils.encode_col(reason_sort);
    var cellAddr = colName + rowNo;
    var reasonNameCell = reasonSheet[cellAddr] ? reasonSheet[cellAddr].v : "";
    while (reasonNameCell != "" && reasonNameCell != reason_name) {
        rowNo++;
        cellAddr = colName + rowNo;
        reasonNameCell = reasonSheet[cellAddr] ? reasonSheet[cellAddr].v : "";
    }
    if (reasonNameCell != reason_name) {
        xlsx.utils.sheet_add_aoa(reasonSheet, [[reason_name]], { origin: cellAddr });
        xlsx.writeFile(wb, current_file_name, { cellDates: true });
        console.log("新增动账种类：" + reason_name + "\n");
        return ("OK");
    } else {
        console.log("动账种类已存在！");
        return ("Duplicate");
    }
}

function addExpenses(current_file_name, expenses_value, expenses_comments, expenses_type, expenses_account) {
    var wb = xlsx.readFile(current_file_name, { cellDates: true });
    var accountSheet = wb.Sheets["资金账户"];
    var expensesTypeFlag = true;
    var colNo = 3;
    var colName = xlsx.utils.encode_col(colNo);
    var cellAddr = colName + "1";
    var accountNameCell = accountSheet[cellAddr] ? accountSheet[cellAddr].v : "";
    while (accountNameCell != "" && accountNameCell != expenses_account) {
        colNo++;
        colName = xlsx.utils.encode_col(colNo);
        cellAddr = colName + "1";
        accountNameCell = accountSheet[cellAddr] ? accountSheet[cellAddr].v : "";
    }
    if (accountNameCell != expenses_account) {
        accountSheet = wb.Sheets["负债账户"];
        expensesTypeFlag = false;
        colNo = 3;
        colName = xlsx.utils.encode_col(colNo);
        cellAddr = colName + "1";
        accountNameCell = accountSheet[cellAddr] ? accountSheet[cellAddr].v : "";
        while (accountNameCell != "" && accountNameCell != expenses_account) {
            colNo++;
            colName = xlsx.utils.encode_col(colNo);
            cellAddr = colName + "1";
            accountNameCell = accountSheet[cellAddr] ? accountSheet[cellAddr].v : "";
        }
    }
    if (accountNameCell != expenses_account) {
        console.log("支出所选账户不存在！");
        return ("NoAccount");
    }
    if (expensesTypeFlag) {
        cellAddr = colName + "2";
        var accountRestCell = accountSheet[cellAddr] ? accountSheet[cellAddr].v : 0;
        if (expenses_value > accountRestCell) {
            console.log("账户余额不足！");
            return ("OUTSTOCK");
        }
    }
    rowNo = 3;
    cellAddr = "A" + rowNo;
    expensesCell = accountSheet[cellAddr] ? accountSheet[cellAddr].v : "";
    while (expensesCell != "") {
        rowNo++;
        cellAddr = "A" + rowNo;
        expensesCell = accountSheet[cellAddr] ? accountSheet[cellAddr].v : "";
    }
    var now_date = new Date().getFullYear() + "-" + (new Date().getMonth() + 1) + "-" + new Date().getDate();
    xlsx.utils.sheet_add_aoa(accountSheet, [[now_date, expenses_type, expenses_comments]], { origin: cellAddr });
    accountSheet[cellAddr].t = "d";
    cellAddr = colName + rowNo;
    xlsx.utils.sheet_add_aoa(accountSheet, [[0 - expenses_value]], { origin: cellAddr });
    accountSheet[cellAddr].t = "n";
    xlsx.writeFile(wb, current_file_name, { cellDates: true });
    console.log("新增支出记录：" + now_date + " " + expenses_type + " " + expenses_value + " " + expenses_comments + "\n");
    return ("OK");
}
function addIncome(current_file_name, income_value, income_comments, income_type, income_account) {
    var wb = xlsx.readFile(current_file_name, { cellDates: true });
    var accountSheet = wb.Sheets["资金账户"];
    var colNo = 3;
    var colName = xlsx.utils.encode_col(colNo);
    var cellAddr = colName + "1";
    var accountNameCell = accountSheet[cellAddr] ? accountSheet[cellAddr].v : "";
    while (accountNameCell != "" && accountNameCell != income_account) {
        colNo++;
        colName = xlsx.utils.encode_col(colNo);
        cellAddr = colName + "1";
        accountNameCell = accountSheet[cellAddr] ? accountSheet[cellAddr].v : "";
    }
    if (accountNameCell != income_account) {
        accountSheet = wb.Sheets["负债账户"];
        colNo = 3;
        colName = xlsx.utils.encode_col(colNo);
        cellAddr = colName + "1";
        accountNameCell = accountSheet[cellAddr] ? accountSheet[cellAddr].v : "";
        while (accountNameCell != "" && accountNameCell != income_account) {
            colNo++;
            colName = xlsx.utils.encode_col(colNo);
            cellAddr = colName + "1";
            accountNameCell = accountSheet[cellAddr] ? accountSheet[cellAddr].v : "";
        }
    }
    if (accountNameCell != income_account) {
        console.log("收入所选账户不存在！");
        return ("NoAccount");
    }
    rowNo = 3;
    cellAddr = "A" + rowNo;
    incomeCell = accountSheet[cellAddr] ? accountSheet[cellAddr].v : "";
    while (incomeCell != "") {
        rowNo++;
        cellAddr = "A" + rowNo;
        incomeCell = accountSheet[cellAddr] ? accountSheet[cellAddr].v : "";
    }
    var now_date = new Date().getFullYear() + "-" + (new Date().getMonth() + 1) + "-" + new Date().getDate();
    xlsx.utils.sheet_add_aoa(accountSheet, [[now_date, income_type, income_comments]], { origin: cellAddr });
    accountSheet[cellAddr].t = "d";
    cellAddr = colName + rowNo;
    xlsx.utils.sheet_add_aoa(accountSheet, [[income_value]], { origin: cellAddr });
    accountSheet[cellAddr].t = "n";
    xlsx.writeFile(wb, current_file_name, { cellDates: true });
    console.log("新增收入记录：" + now_date + " " + income_type + " " + income_value + " " + income_comments + "\n");
    return ("OK");
}

function addTransfer(current_file_name, transfer_value, transfer_comments, transfer_type, transfer_out, transfer_in) {
    var result = addExpenses(current_file_name, transfer_value, transfer_comments, transfer_type, transfer_out);
    if (result == "OK") {
        result = addIncome(current_file_name, transfer_value, transfer_comments, transfer_type, transfer_in);
        if (result == "OK") {
            console.log("新增转账记录：" + new Date().getFullYear() + "-" + (new Date().getMonth() + 1) + "-" + new Date().getDate() + " " + transfer_type + " " + transfer_value + " " + transfer_comments + "\n");
            return ("OK");
        } else if (result == "NoAccount") {
            return ("NoInAccount");
        }
    }
    else if (result == "OUTSTOCK") {
        return ("OUTSTOCK");
    } else if (result == "NoAccount") {
        return ("NoOutAccount");
    }
}

var server = app.listen(3456, function () {

    var host = server.address().address;
    var port = server.address().port;

    console.log("应用实例，访问地址为 http://%s:%s", host, port);

})
