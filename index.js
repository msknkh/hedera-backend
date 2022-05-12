const { Client, PrivateKey, ContractCreateTransaction, FileAppendTransaction, ContractFunctionParameters, ContractExecuteTransaction, ContractCallQuery, AccountCreateTransaction, AccountBalanceQuery, Hbar, TopicMessageSubmitTransaction, FileCreateTransaction } = require("@hashgraph/sdk");
require("dotenv").config();
const fs = require("fs");

async function main() {

    //Grab your Hedera testnet account ID and private key from your .env file
    const myAccountId = process.env.MY_ACCOUNT_ID;
    const myPrivateKey = process.env.MY_PRIVATE_KEY;

    const operatorKey = PrivateKey.fromString(process.env.MY_PRIVATE_KEY);


    // If we weren't able to grab it, we should throw a new error
    if (myAccountId == null ||
        myPrivateKey == null ) {
        throw new Error("Environment variables myAccountId and myPrivateKey must be present");
    }

    // Create our connection to the Hedera network
    // The Hedera JS SDK makes this really easy!
    const client = Client.forTestnet();
    client.setOperator(myAccountId, myPrivateKey);

    //Import the compiled contract from the HelloHedera.json file
    const bytecode = fs.readFileSync("Contract_sol_HelloHedera.bin");

	//Create a file on Hedera and store the contract bytecode
	const fileCreateTx = new FileCreateTransaction().setKeys([operatorKey]).freezeWith(client);
	const fileCreateSign = await fileCreateTx.sign(operatorKey);
	const fileCreateSubmit = await fileCreateSign.execute(client);
	const fileCreateRx = await fileCreateSubmit.getReceipt(client);
	const bytecodeFileId = fileCreateRx.fileId;
	console.log(`- The smart contract bytecode file ID is ${bytecodeFileId}`);

	// Append contents to the file
	const fileAppendTx = new FileAppendTransaction()
		.setFileId(bytecodeFileId)
		.setContents(bytecode)
		.setMaxChunks(10)
		.freezeWith(client);
	const fileAppendSign = await fileAppendTx.sign(operatorKey);
	const fileAppendSubmit = await fileAppendSign.execute(client);
	const fileAppendRx = await fileAppendSubmit.getReceipt(client);
	console.log(`- Content added: ${fileAppendRx.status} \n`);

    // Instantiate the contract instance
    const contractTx = await new ContractCreateTransaction()
    //Set the file ID of the Hedera file storing the bytecode
    .setBytecodeFileId(bytecodeFileId)
    .setGas(1000000)
    .setConstructorParameters(new ContractFunctionParameters().addString("polywrap").addAddress('0xB4C0402c077a08e1B2908B8865893E368e19ea9e'));
    const contractResponse = await contractTx.execute(client);
    const contractReceipt = await contractResponse.getReceipt(client);
    const newContractId = contractReceipt.contractId;
    console.log("The smart contract ID is " + newContractId);

    //Transaction to see the allowed address for a dao 
    const contractQuery = await new ContractCallQuery()
    .setGas(100000)
    .setContractId(newContractId)
    .setFunction("getEditorList", new ContractFunctionParameters().addString("polywrap"))
    .setQueryPayment(new Hbar(2));
    const getAddressList = await contractQuery.execute(client);
    console.log("The allowed address list: " + JSON.stringify(getAddressList));

     
    //Create the transaction to add another editor address
    const contractExecTx = await new ContractExecuteTransaction()
    .setContractId(newContractId)
    .setGas(100000)
    .setFunction("setEditor", new ContractFunctionParameters().addString("fwb").addAddress('0xB4C0402c077a08e1B2908B8865893E368e19ea9e'));
    const submitExecTx = await contractExecTx.execute(client);
    const receipt2 = await submitExecTx.getReceipt(client);
    console.log("The transaction status is " + receipt2.status.toString());


    //Query the contract to check if an address is an editor for a dao
    const contractCallQuery = new ContractCallQuery()
    .setContractId(newContractId)
    .setGas(100000)
    .setFunction("isEditor", new ContractFunctionParameters().addString("fwb").addAddress('0xB4C0402c077a08e1B2908B8865893E368e19ea9e'))
    .setQueryPayment(new Hbar(10));
    const contractUpdateResult = await contractCallQuery.execute(client);
    const isEditorAddress = contractUpdateResult.getBool(0);
    console.log("Bool for if the address is editor for the dao: " + isEditorAddress);

}
main();
