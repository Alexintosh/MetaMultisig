DApp = {
    walletContract: null,
    walletAbi: [{"constant":true,"inputs":[],"name":"threshold","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"destinations","type":"address[]"},{"name":"values","type":"uint256[]"},{"name":"datas","type":"bytes[]"}],"name":"multicall","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"","type":"address"}],"name":"keyholders","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"destination","type":"address"},{"name":"value","type":"uint256"},{"name":"data","type":"bytes"},{"name":"nonce","type":"uint256"},{"name":"sigs","type":"bytes[]"}],"name":"submit","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"_threshold","type":"uint256"}],"name":"setThreshold","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"destination","type":"address"},{"name":"value","type":"uint256"},{"name":"data","type":"bytes"},{"name":"nonce","type":"uint256"}],"name":"getTransactionHash","outputs":[{"name":"","type":"bytes32"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"nextNonce","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"keyholder","type":"address"},{"name":"weight","type":"uint256"}],"name":"setKeyholderWeight","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"inputs":[{"name":"addresses","type":"address[]"},{"name":"weights","type":"uint256[]"},{"name":"_threshold","type":"uint256"}],"payable":false,"stateMutability":"nonpayable","type":"constructor"},{"payable":true,"stateMutability":"payable","type":"fallback"},{"anonymous":false,"inputs":[{"indexed":true,"name":"keyholder","type":"address"},{"indexed":false,"name":"weight","type":"uint256"}],"name":"KeyholderChanged","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"threshold","type":"uint256"}],"name":"ThresholdChanged","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"destination","type":"address"},{"indexed":false,"name":"value","type":"uint256"},{"indexed":false,"name":"data","type":"bytes"},{"indexed":false,"name":"nonce","type":"uint256"},{"indexed":false,"name":"returndata","type":"bytes"},{"indexed":false,"name":"signatories","type":"address[]"}],"name":"Transaction","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"sender","type":"address"},{"indexed":false,"name":"value","type":"uint256"}],"name":"Deposit","type":"event"}],
    emptyAddress: '0x0000000000000000000000000000000000000000',

    walletAddress: "0x44F5027aAACd75aB89b40411FB119f8Ca82fE733",

//{"contract":"0x44F5027aAACd75aB89b40411FB119f8Ca82fE733", "nonce":0, "users":{"0xa303ddC620aa7d1390BACcc8A495508B183fab59":1,"0x3Abf4443F1Fd1Cc89fc129B44e71dd9c96e260aB":1}, "threshold":1}

    init: function() {
        console.log('[x] Initializing DApp.');
        this.initWeb3();
    },

    initWeb3: function() {
        window.addEventListener('load', () => {
            // If web3 is not injected
            if (typeof web3 === 'undefined') {
                // Listen for provider injection
                window.addEventListener('message', ({ data }) => {
                    if (data && data.type && data.type === 'ETHEREUM_PROVIDER_SUCCESS') {
                        // Use injected provider
                        web3 = new Web3(ethereum);
                        console.log('[x] web3 object initialized.');
                        DApp.initContracts();
                    } else {
                        // No web3 instance available show a popup
                        $('#metamaskModal').modal('show');
                    }
                });
                // Request provider
                window.postMessage({ type: 'ETHEREUM_PROVIDER_REQUEST' }, '*');
            }
            // If web3 is injected use it's provider
            else {
                web3 = new Web3(web3.currentProvider);
                console.log('[x] web3 object initialized.');
                DApp.initContracts();
            }
        });
    },

    initContracts: function() {
        DApp.walletContract = new web3.eth.Contract(DApp.walletAbi, DApp.walletAddress);
        console.log('[x] wallet contract initialized.');

        DApp.loadAccount();

        fetch('http://localhost:8080/api/contracts/0x44F5027aAACd75aB89b40411FB119f8Ca82fE733')
            .then(function(response) {
                return response.json();
            })
            .then(function(myJson) {
                console.log("XXXXX", JSON.stringify(myJson));
            });
    },

    loadAccount: function() {
        web3.eth.getAccounts(function(error, accounts) {
            if(error) {
                console.error("[x] Error loading accounts", error);
            } else {
                DApp.currentAccount = accounts[0];
                console.log("[x] Using account", DApp.currentAccount);

                DApp.initActions();
                DApp.initFrontend();
            }
        });
    },

    initActions: function() {
        $("#etherIn").on("paste keyup", function() {
            $("#tokenOut").val($("#etherIn").val() * $("#buyRate").val());
        });
        $("#tokenOut").on("paste keyup", function() {
            $("#etherIn").val($("#tokenOut").val() / $("#buyRate").val());
        });
        $("#tokenIn").on("paste keyup", function() {
            $("#etherOut").val($("#tokenIn").val() / $("#sellRate").val());
        });
        $("#etherOut").on("paste keyup", function() {
            $("#tokenIn").val($("#etherOut").val() * $("#sellRate").val());
        });
        $("#buy-tokens-button").click(function(){
            let amount = web3.utils.toWei($("#etherIn").val().toString(), "ether");
            let rate =  $("#buyRate").val();
            console.log("rate", rate);
            let tx = {value: amount, from: DApp.currentAccount};
            console.log("tx", tx);
            DApp.walletContract.methods.buyTokens(rate).send(tx, function(error, res) {
                if(error) {
                    console.log(error);
                } else {
                    console.log("res", res);
                    // /$('#userTokenBalance').val(web3.utils.fromWei(balance, "ether"));
                }
            });
        });
        $("#approve-tokens-button").click(function(){
            let amount = $("#tokenIn").val() * DApp.tokenDecimalsMultiplier;
            DApp.tokenContract.methods.approve(DApp.walletAddress, amount).send({from: DApp.currentAccount}, function(error, res) {
                if(error) {
                    console.log("approve", error);
                } else {
                    console.log("approve", res);
                }
            });
        });
        $("#sell-tokens-button").click(function(){
            let amount = $("#tokenIn").val() * DApp.tokenDecimalsMultiplier;
            let rate =  $("#sellRate").val();
            DApp.walletContract.methods.sellTokens(rate, amount).send({from: DApp.currentAccount}, function(error, res) {
                if(error) {
                    console.log("sell", error);
                } else {
                    console.log("sell", res);
                }
            });
        });
    },

    updateEtherBalance: function(){
        web3.eth.getBalance(DApp.currentAccount, function(error, ethBalance) {
            if (error) {
                // handle error
                console.log("Couldn't get user ether balance: ", error);
            } else {
                console.log("user Eth balance", ethBalance);
                $('#userEtherBalance').val(web3.utils.fromWei(ethBalance.toString(), "ether"));
            }
        });
        web3.eth.getBalance(DApp.walletAddress, function(error, ethBalance) {
            if (error) {
                // handle error
                console.log("Couldn't get wallet ether balance: ", error);
            } else {
                console.log("EX Eth balance", ethBalance);
                $('#walletEtherBalance').val(web3.utils.fromWei(ethBalance.toString(), "ether"));
            }
        });
    },

    updateTokenBalance: function(){
        DApp.tokenContract.methods.balanceOf(DApp.currentAccount).call(function(error, balance) {
            if(error) {
                console.log(error);
            } else {
                console.log("user token balance", balance);
                $('#userTokenBalance').val(balance/DApp.tokenDecimalsMultiplier);
            }
        });
        DApp.tokenContract.methods.allowance(DApp.currentAccount, DApp.walletAddress).call(function(error, balance) {
            if(error) {
                console.log(error);
            } else {
                console.log("user token approved", balance);
                $('#userTokenApproved').val(balance/DApp.tokenDecimalsMultiplier);
            }
        });
        DApp.tokenContract.methods.balanceOf(DApp.walletAddress).call(function(error, balance) {
            if(error) {
                console.log(error);
            } else {
                console.log("ex token balance", balance);
                $('#walletTokenBalance').val(balance/DApp.tokenDecimalsMultiplier);
            }
        });
    },

    updateRates: function(){
        DApp.walletContract.methods.buyRate().call(function(error, rate) {
            if(error) {
                console.log(error);
            } else {
                $('#buyRate').val(rate);
            }
        });
        DApp.walletContract.methods.sellRate().call(function(error, rate) {
            if(error) {
                console.log(error);
            } else {
                $('#sellRate').val(rate);
            }
        });
    },

    initFrontend: function(){
        $('#userWallet').val(DApp.currentAccount);
        $('#walletAddress').val(DApp.walletAddress);
        DApp.updateEtherBalance();
        DApp.updateTokenBalance();
        DApp.updateRates();
    }
}

$(function() {
    DApp.init();
});