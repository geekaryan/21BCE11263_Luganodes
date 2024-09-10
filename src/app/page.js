"use client";
import { useState, useEffect } from "react";
import { ethers } from "ethers";

export default function Home() {
  const [totalBalance, setTotalBalance] = useState(0); // This totalBalance tells us the total balance in beacon chain
  const [deposits, setDeposits] = useState([]); // This is used to send the deposits to the backend server
  const [contractDeposits, setContractDeposits] = useState([]); // It stores the contractDeposits and used to render on the screen

  // Beacon deposit contract address
  const BEACON_CONTRACT_ADDRESS = "0x00000000219ab540356cBB839Cbe05303d7705Fa";

  // Transaction hashes to track
  const trackedDeposits = [
    "0x1391be19259f10e01336a383217cf35344dd7aa157e95030f46235448ef5e5d6",
    "0x53c98c3371014fd54275ebc90a6e42dffa2eee427915cab5f80f1e3e9c64eba4",
  ];

  // ABI for the Deposit event in the Beacon contract
  const BEACON_CONTRACT_ABI = [
    "event DepositEvent(bytes pubkey, bytes withdrawal_credentials, bytes amount, bytes signature)",
  ];

  // This Function sends the Deposit to the backend
  const saveDepositToDB = async (deposit) => {
    try {
      console.log("kyu nhi jaa rhi ho priyee");
      console.log(deposit);
      const response = await fetch("http://localhost:7000/api/deposit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(deposit),
      });
      const data = await response.json();
      console.log("Deposit saved:", data);
    } catch (error) {
      console.error("Error saving deposit:", error);
    }
  };

  // This function is implemented to fetch the balance of BeaconContract
  const fetchBeaconContractBalance = async () => {
    // console.log(process.env.NEXT_PUBLIC_ALCHEMY_URL);
    try {
      const provider = new ethers.providers.JsonRpcProvider(
        process.env.NEXT_PUBLIC_ALCHEMY_URL
      );

      const balance = await provider.getBalance(BEACON_CONTRACT_ADDRESS);
      setTotalBalance(ethers.utils.formatEther(balance));
    } catch (err) {
      console.error("Error fetching balance from Alchemy:", err);
    }
  };

  // This function fetch and track specific deposit transactions by their hash
  const fetchTrackedDeposits = async () => {
    try {
      const provider = new ethers.providers.JsonRpcProvider(
        process.env.NEXT_PUBLIC_ALCHEMY_URL
      );

      const newDeposits = [];
      for (const hash of trackedDeposits) {
        const tx = await provider.getTransaction(hash);
        if (tx) {
          const receipt = await provider.getTransactionReceipt(hash);
          const block = await provider.getBlock(receipt.blockNumber);
          const deposit = {
            txHash: tx.hash,
            from: tx.from,
            to: tx.to,
            value: ethers.utils.formatEther(tx.value),
            gasUsed: receipt.gasUsed.toString(),
            blockTimestamp: new Date(block.timestamp * 1000).toLocaleString(),
          };
          newDeposits.push(deposit);

          // Save each deposit to MongoDB
          await saveDepositToDB(deposit);
        }
      }

      setDeposits(newDeposits);
      localStorage.setItem("deposits", JSON.stringify(newDeposits));
    } catch (err) {
      console.error("Error fetching tracked deposits:", err);
    }
  };

  //This function fetch deposit events emitted by the Beacon contract
  const fetchContractDeposits = async () => {
    try {
      const provider = new ethers.providers.JsonRpcProvider(
        process.env.NEXT_PUBLIC_ALCHEMY_URL
      );

      const contract = new ethers.Contract(
        BEACON_CONTRACT_ADDRESS,
        BEACON_CONTRACT_ABI,
        provider
      );

      const filter = contract.filters.DepositEvent();
      const events = await contract.queryFilter(filter);

      const formattedEvents = await Promise.all(
        events.map(async (event) => {
          const block = await provider.getBlock(event.blockNumber);
          const deposit = {
            pubkey: event.args[0],
            withdrawal_credentials: event.args[1],
            amount: ethers.utils.formatEther(event.args[2]),
            signature: event.args[3],
            blockTimestamp: new Date(block.timestamp * 1000).toLocaleString(),
          };

          // Save each contract deposit to MongoDB
          await saveDepositToDB(deposit);

          return deposit;
        })
      );

      setContractDeposits(formattedEvents);
      localStorage.setItem("contractDeposits", JSON.stringify(formattedEvents));
    } catch (err) {
      console.error("Error fetching contract deposits:", err);
    }
  };

  //This function Load previous deposits from localStorage to show some of the contracts
  const loadPreviousDeposits = () => {
    const storedDeposits = localStorage.getItem("deposits");
    if (storedDeposits) {
      setDeposits(JSON.parse(storedDeposits));
    }

    const storedContractDeposits = localStorage.getItem("contractDeposits");
    if (storedContractDeposits) {
      setContractDeposits(JSON.parse(storedContractDeposits));
    }
  };

  // UseEffect automatically load previous deposits and fetch new deposits when the component mounts
  useEffect(() => {
    loadPreviousDeposits(); // Load previous deposits from localStorage
    fetchTrackedDeposits(); // Fetch tracked deposits by transaction hash
    fetchContractDeposits(); // Fetch deposits from contract events
  }, []); // Empty array means this runs only once when the component mounts

  return (
    <>
      <div className="flex flex-col items-center justify-center h-screen">
        <h1 className="text-center text-2xl font-bold mb-4">
          Aryan Rana 21BCE11263
        </h1>

        <button
          type="submit"
          onClick={fetchBeaconContractBalance}
          className="btn btn-primary m-2 normal-case"
        >
          Beacon Contract Balance
        </button>

        {totalBalance > 0 && (
          <div className="stats bg-primary text-primary-content m-4">
            <div className="stat">
              <div className="stat-title">Summed Amount of Beacon Contract</div>
              <div className="stat-value">
                {parseFloat(totalBalance).toLocaleString(undefined, {
                  minimumFractionDigits: 4,
                })}{" "}
                ETH
              </div>
            </div>
          </div>
        )}

        {/* Tracked Deposit Transactions */}
        <div className="container mt-4">
          <h2 className="text-xl font-semibold text-center">
            Tracked Deposit Transactions
          </h2>
          {deposits.length > 0 ? (
            <table className="table w-3/4 mx-auto table-zebra border-collapse border border-gray-200 rounded-lg">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border px-4 py-2">Transaction Hash</th>
                  <th className="border px-4 py-2">From</th>
                  <th className="border px-4 py-2">To</th>
                  <th className="border px-4 py-2">Value (ETH)</th>
                  <th className="border px-4 py-2">Gas Used</th>
                  <th className="border px-4 py-2">Block Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {deposits.map((deposit, index) => (
                  <tr
                    key={index}
                    className="hover:bg-gray-50 text-center transition-colors duration-150"
                  >
                    <td className="border px-4 py-2">{deposit.txHash}</td>
                    <td className="border px-4 py-2">{deposit.from}</td>
                    <td className="border px-4 py-2">{deposit.to}</td>
                    <td className="border px-4 py-2">{deposit.value}</td>
                    <td className="border px-4 py-2">{deposit.gasUsed}</td>
                    <td className="border px-4 py-2">
                      {deposit.blockTimestamp}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-center">
              No new tracked deposits found, displaying previous transactions.
            </p>
          )}
        </div>

        {/* Contract Deposit Events */}
        <div className="container mt-4">
          <h2 className="text-xl font-semibold text-center">
            Contract Deposit Events
          </h2>
          {contractDeposits.length > 0 ? (
            <table className="table w-3/4 mx-auto table-zebra border-collapse border border-gray-200 rounded-lg">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border px-4 py-2">Pubkey</th>
                  <th className="border px-4 py-2">Withdrawal Credentials</th>
                  <th className="border px-4 py-2">Amount (ETH)</th>
                  <th className="border px-4 py-2">Signature</th>
                  <th className="border px-4 py-2">Block Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {contractDeposits.map((deposit, index) => (
                  <tr
                    key={index}
                    className="hover:bg-gray-50 text-center transition-colors duration-150"
                  >
                    <td className="border px-4 py-2">{deposit.pubkey}</td>
                    <td className="border px-4 py-2">
                      {deposit.withdrawal_credentials}
                    </td>
                    <td className="border px-4 py-2">{deposit.amount}</td>
                    <td className="border px-4 py-2">{deposit.signature}</td>
                    <td className="border px-4 py-2">
                      {deposit.blockTimestamp}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-center">
              No contract deposits found, displaying previous events.
            </p>
          )}
        </div>
      </div>
    </>
  );
}
