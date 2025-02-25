import React, { useState } from "react";
import { Line } from "react-chartjs-2";
import "chart.js/auto";

// Main component for the Retirement Planning Tool
export default function RetirementForm() {
  // Initial state with all inputs and defaults
  const [formData, setFormData] = useState({
    ageToLowRiskFund: "", // Age to consolidate all funds into low-risk
    numFunds: "3", // Number of funds in decumulation (1-5), defaults to 3
    funds: ["Future Advantage 1", "Future Advantage 3", "Future Advantage 5"], // Array of selected funds
    age: "", // Current age of the user
    salary: "", // Starting salary
    currentPot: "", // Initial retirement pot value
    contributionRate: "", // Percentage of salary contributed annually
    retirementAge: "", // Age at which user retires
    fundSelection: "Future Advantage 5", // Fund used during accumulation
    drawdownType: "percentage", // Type of withdrawal: percentage, fixed, or initialPot
    drawdownPercentage: "", // Percentage for percentage-based drawdown
    drawdownFixed: "", // Fixed monthly amount for fixed drawdown
    drawdownInitialPotPercentage: "", // Percentage of initial pot for initialPot drawdown
    inflationRate: "", // Annual inflation rate
  });

  // State to track validation errors
  const [errors, setErrors] = useState({});

  // Handles changes to all inputs, including dynamic fund selections
  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith("fund")) {
      // Update specific fund in the funds array
      const index = parseInt(name.replace("fund", ""));
      const newFunds = [...formData.funds];
      newFunds[index] = value;
      setFormData({ ...formData, funds: newFunds });
    } else if (name === "numFunds") {
      // Adjust number of funds and resize funds array accordingly
      const num = parseInt(value);
      const newFunds = formData.funds.slice(0, num).concat(Array(Math.max(0, num - formData.funds.length)).fill("Future Advantage 1"));
      setFormData({ ...formData, numFunds: value, funds: newFunds });
    } else {
      // Update other form fields directly
      setFormData({ ...formData, [name]: value });
    }
    // Clear error for the changed field
    setErrors({ ...errors, [name]: "" });
  };

  // Fund data with annual returns and volatility
  const fundData = {
    "Future Advantage 1": { return: 0.025, volatility: 0.05 },
    "Future Advantage 2": { return: 0.03, volatility: 0.0556 },
    "Future Advantage 3": { return: 0.035, volatility: 0.0799 },
    "Future Advantage 4": { return: 0.045, volatility: 0.1151 },
    "Future Advantage 5": { return: 0.053, volatility: 0.1464 },
  };

  // Constants for state pension (assumed fixed, not inflation-adjusted here)
  const STATE_PENSION_ANNUAL = 11960;
  const STATE_PENSION_MONTHLY = STATE_PENSION_ANNUAL / 12; // £996.67

  // Validates all inputs before running simulation
  const validateInputs = () => {
    const newErrors = {};
    const { age, salary, currentPot, contributionRate, retirementAge, drawdownType, drawdownPercentage, drawdownFixed, drawdownInitialPotPercentage, ageToLowRiskFund, inflationRate, numFunds, funds } = formData;
    // List of fields to validate
    const fields = [
      { name: "age", label: "Current Age", value: age },
      { name: "salary", label: "Salary", value: salary },
      { name: "currentPot", label: "Current Pot", value: currentPot },
      { name: "contributionRate", label: "Contribution Rate", value: contributionRate },
      { name: "retirementAge", label: "Retirement Age", value: retirementAge },
      { name: "ageToLowRiskFund", label: "Age to Low Risk Fund", value: ageToLowRiskFund },
      { name: "inflationRate", label: "Inflation Rate", value: inflationRate },
      { name: "numFunds", label: "Number of Funds", value: numFunds },
    ];

    // Add drawdown-specific field based on type
    if (drawdownType === "percentage") {
      fields.push({ name: "drawdownPercentage", label: "Drawdown Percentage", value: drawdownPercentage });
    } else if (drawdownType === "fixed") {
      fields.push({ name: "drawdownFixed", label: "Fixed Drawdown Amount", value: drawdownFixed });
    } else if (drawdownType === "initialPot") {
      fields.push({ name: "drawdownInitialPotPercentage", label: "Initial Pot Drawdown Percentage", value: drawdownInitialPotPercentage });
    }

    // Check for valid numbers
    for (const field of fields) {
      if (!field.value || isNaN(parseFloat(field.value))) {
        newErrors[field.name] = `${field.label} must be a valid number.`;
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return false;
    }

    // Parse values for further validation
    const parsedAge = parseInt(age);
    const parsedRetirementAge = parseInt(retirementAge);
    const parsedSalary = parseFloat(salary);
    const parsedCurrentPot = parseFloat(currentPot);
    const parsedContributionRate = parseFloat(contributionRate);
    const parsedDrawdownPercentage = parseFloat(drawdownPercentage);
    const parsedDrawdownFixed = parseFloat(drawdownFixed);
    const parsedDrawdownInitialPotPercentage = parseFloat(drawdownInitialPotPercentage);
    const parsedAgeToLowRiskFund = parseInt(ageToLowRiskFund);
    const parsedInflationRate = parseFloat(inflationRate);
    const parsedNumFunds = parseInt(numFunds);

    // Range and logic checks
    if (parsedAge <= 0) newErrors.age = "Current Age must be positive.";
    if (parsedRetirementAge <= parsedAge) newErrors.retirementAge = "Retirement Age must be greater than Current Age.";
    if (parsedSalary <= 0) newErrors.salary = "Salary must be positive.";
    if (parsedCurrentPot < 0) newErrors.currentPot = "Current Pot cannot be negative.";
    if (parsedContributionRate <= 0 || parsedContributionRate > 100)
      newErrors.contributionRate = "Contribution Rate must be between 0 and 100%.";
    if (drawdownType === "percentage" && (parsedDrawdownPercentage <= 0 || parsedDrawdownPercentage > 100))
      newErrors.drawdownPercentage = "Drawdown Percentage must be between 0 and 100%.";
    if (drawdownType === "fixed" && parsedDrawdownFixed <= 0)
      newErrors.drawdownFixed = "Fixed Drawdown Amount must be positive.";
    if (drawdownType === "initialPot" && (parsedDrawdownInitialPotPercentage <= 0 || parsedDrawdownInitialPotPercentage > 100))
      newErrors.drawdownInitialPotPercentage = "Initial Pot Drawdown Percentage must be between 0 and 100%.";
    if (parsedAgeToLowRiskFund < parsedRetirementAge)
      newErrors.ageToLowRiskFund = "Age to Low Risk Fund must be at least the Retirement Age.";
    if (parsedInflationRate < 0 || parsedInflationRate > 20)
      newErrors.inflationRate = "Inflation Rate must be between 0% and 20%.";
    if (parsedNumFunds < 1 || parsedNumFunds > 5)
      newErrors.numFunds = "Number of Funds must be between 1 and 5.";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return false;
    }

    setErrors({});
    return true;
  };

  // Simulates the accumulation phase until retirement
  const simulateAccumulation = () => {
    const { return: meanReturn, volatility } = fundData[formData.fundSelection];
    const years = formData.retirementAge - formData.age;
    const simulations = 1000; // Number of Monte Carlo simulations
    const results = [];
    const inflationRate = parseFloat(formData.inflationRate) / 100;

    for (let i = 0; i < simulations; i++) {
      let pot = parseFloat(formData.currentPot);
      let salary = parseFloat(formData.salary);
      let contributionRate = parseFloat(formData.contributionRate) / 100;
      let yearlyBalances = [];

      // Simulate each year until retirement
      for (let year = 0; year < years; year++) {
        let contribution = salary * contributionRate;
        let annualReturn = meanReturn + volatility * (Math.random() * 2 - 1); // Random return within volatility
        pot = (pot + contribution) * (1 + annualReturn);
        yearlyBalances.push(pot);
        salary *= (1 + inflationRate); // Apply inflation to salary
      }
      results.push(yearlyBalances);
    }

    // Calculate percentiles for each year
    const percentiles = Array.from({ length: years }, (_, i) =>
      results.map((run) => run[i]).sort((a, b) => a - b)
    );

    const getPercentile = (data, percentile) => {
      const index = Math.floor(percentile * data.length);
      return data[index];
    };

    const p25 = percentiles.map((row) => getPercentile(row, 0.25));
    const p50 = percentiles.map((row) => getPercentile(row, 0.5));
    const p75 = percentiles.map((row) => getPercentile(row, 0.75));

    return { p25, p50, p75 };
  };

  // Simulates the decumulation phase after retirement
  const simulateDecumulation = (startingPot) => {
    // Return minimal data if starting pot is invalid
    if (!startingPot || isNaN(startingPot) || startingPot <= 0) 
      return { funds: [Array(12).fill(0)], withdrawals: [0], annualWithdrawals: [0] };

    const numFunds = parseInt(formData.numFunds);
    const pots = Array(numFunds).fill(startingPot / numFunds); // Split pot evenly across funds
    const returns = formData.funds.map(fund => fundData[fund].return / 12); // Monthly returns
    const fundBalances = Array(numFunds).fill([]).map(() => []); // Track balances for each fund

    const drawdownRate = formData.drawdownType === "percentage" ? parseFloat(formData.drawdownPercentage) / 100 / 12 : 0;
    let baseDrawdownFixed = formData.drawdownType === "fixed" ? parseFloat(formData.drawdownFixed) 
      : formData.drawdownType === "initialPot" ? (startingPot * parseFloat(formData.drawdownInitialPotPercentage) / 100) / 12 : 0;
    const inflationRate = parseFloat(formData.inflationRate) / 100;
    const switchAge = parseInt(formData.ageToLowRiskFund);
    const retirementAge = parseInt(formData.retirementAge);
    const maxMonths = (100 - retirementAge) * 12;
    let age = retirementAge;
    let months = 0;
    let withdrawals = [];
    let annualWithdrawals = [];
    let currentYearWithdrawals = 0;
    let movedFunds = Array(numFunds - 1).fill(false); // Flags for each fund moved into low-risk
    let currentDrawdownFixed = baseDrawdownFixed;

    // Run monthly simulation until pot depletes or max age reached
    while (pots.reduce((sum, pot) => sum + pot, 0) > 0 && months < maxMonths) {
      let withdrawal = formData.drawdownType === "percentage" 
        ? pots.reduce((sum, pot) => sum + pot, 0) * drawdownRate 
        : currentDrawdownFixed;
      withdrawal = Math.min(withdrawal, pots[0]); // Cap withdrawal at available low-risk fund
      pots[0] -= withdrawal;
      currentYearWithdrawals += withdrawal;

      // Apply monthly returns to all funds
      for (let i = 0; i < numFunds; i++) {
        pots[i] = Math.max(0, pots[i] * (1 + returns[i]));
      }

      // Rebalance active funds annually
      if (months % 12 === 11) {
        const activeFunds = pots.filter(pot => pot > 0).length;
        if (activeFunds > 1) {
          const total = pots.reduce((sum, pot) => sum + pot, 0);
          const activePots = pots.map(pot => pot > 0 ? total / activeFunds : 0);
          for (let i = 0; i < numFunds; i++) {
            pots[i] = activePots[i];
          }
        }
      }

      // Move funds sequentially when low-risk fund falls below 12 months of withdrawal
      for (let i = 0; i < numFunds - 1; i++) {
        if (pots[0] < withdrawal * 12 && !movedFunds[i] && pots[i + 1] > 0) {
          pots[0] += pots[i + 1];
          pots[i + 1] = 0;
          movedFunds[i] = true;
          break; // Move one fund at a time
        }
      }

      // Force all funds into low-risk if switch age is reached
      if (age >= switchAge && pots.slice(1).some(pot => pot > 0)) {
        const totalRemaining = pots.slice(1).reduce((sum, pot) => sum + pot, 0);
        pots[0] += totalRemaining;
        for (let i = 1; i < numFunds; i++) pots[i] = 0;
        movedFunds.fill(true);
      }

      // Aggregate withdrawals annually and adjust fixed drawdown for inflation
      if (months % 12 === 11) {
        annualWithdrawals.push(currentYearWithdrawals);
        currentYearWithdrawals = 0;
        if (formData.drawdownType === "fixed" || formData.drawdownType === "initialPot") {
          currentDrawdownFixed *= (1 + inflationRate);
        }
      }

      // Store current balances for charting
      for (let i = 0; i < numFunds; i++) {
        fundBalances[i].push(pots[i]);
      }
      withdrawals.push(withdrawal);

      if (pots.reduce((sum, pot) => sum + pot, 0) < 1) {
        if (currentYearWithdrawals > 0) annualWithdrawals.push(currentYearWithdrawals);
        break;
      }

      months++;
      age = retirementAge + Math.floor(months / 12);
    }

    return { funds: fundBalances, withdrawals, annualWithdrawals };
  };

  // Runs simulations and updates charts
  const handleCalculate = () => {
    if (!validateInputs()) return;

    // Accumulation simulation
    const { p25, p50, p75 } = simulateAccumulation();
    const accumulationLabels = Array.from(
      { length: p50.length },
      (_, i) => parseInt(formData.age) + i
    );
    setAccumulationChartData({
      labels: accumulationLabels,
      datasets: [
        { label: "25th Percentile", data: p25, borderColor: "red", fill: false },
        { label: "50th Percentile", data: p50, borderColor: "blue", fill: false },
        { label: "75th Percentile", data: p75, borderColor: "green", fill: false },
      ],
    });

    setAccumulationTableData({
      p25: p25[p25.length - 1],
      p50: p50[p50.length - 1],
      p75: p75[p75.length - 1],
    });

    // Decumulation simulation
    const decumulationResults = simulateDecumulation(p50[p50.length - 1]);
    const decumulationLabels = Array.from(
      { length: decumulationResults.funds[0].length },
      (_, i) => parseInt(formData.retirementAge) + Math.floor(i / 12)
    );
    const colors = [
      { background: "rgba(128, 0, 128, 0.5)", border: "purple" }, // Fund 1
      { background: "rgba(255, 165, 0, 0.5)", border: "orange" }, // Fund 2
      { background: "rgba(0, 128, 128, 0.5)", border: "teal" },   // Fund 3
      { background: "rgba(255, 0, 0, 0.5)", border: "red" },      // Fund 4
      { background: "rgba(0, 255, 0, 0.5)", border: "green" },    // Fund 5
    ];
    // Dynamically generate datasets for all selected funds
    setDecumulationChartData({
      labels: decumulationLabels,
      datasets: Array.from({ length: parseInt(formData.numFunds) }, (_, i) => ({
        label: `Fund ${i + 1}`,
        data: decumulationResults.funds[i],
        backgroundColor: colors[i].background,
        borderColor: colors[i].border,
        fill: true,
      })),
    });

    // Monthly income chart
    const monthlyIncomeLabels = Array.from(
      { length: decumulationResults.withdrawals.length },
      (_, i) => parseInt(formData.retirementAge) + Math.floor(i / 12)
    );
    setMonthlyIncomeChartData({
      labels: monthlyIncomeLabels,
      datasets: [
        {
          label: "State Pension",
          data: Array(decumulationResults.withdrawals.length).fill(STATE_PENSION_MONTHLY),
          backgroundColor: "rgba(0, 255, 0, 0.5)",
          borderColor: "green",
          fill: true,
        },
        {
          label: "Drawdown Income",
          data: decumulationResults.withdrawals,
          backgroundColor: "rgba(255, 0, 0, 0.5)",
          borderColor: "red",
          fill: true,
        },
      ],
    });

    // Annual income chart
    const annualIncomeLabels = Array.from(
      { length: decumulationResults.annualWithdrawals.length },
      (_, i) => parseInt(formData.retirementAge) + i
    );
    setAnnualIncomeChartData({
      labels: annualIncomeLabels,
      datasets: [
        {
          label: "State Pension",
          data: Array(decumulationResults.annualWithdrawals.length).fill(STATE_PENSION_ANNUAL),
          backgroundColor: "rgba(0, 255, 0, 0.5)",
          borderColor: "green",
          fill: true,
        },
        {
          label: "Drawdown Income",
          data: decumulationResults.annualWithdrawals,
          backgroundColor: "rgba(255, 0, 0, 0.5)",
          borderColor: "red",
          fill: true,
        },
      ],
    });
  };

  // State for chart data
  const [accumulationChartData, setAccumulationChartData] = useState(null);
  const [accumulationTableData, setAccumulationTableData] = useState(null);
  const [decumulationChartData, setDecumulationChartData] = useState(null);
  const [monthlyIncomeChartData, setMonthlyIncomeChartData] = useState(null);
  const [annualIncomeChartData, setAnnualIncomeChartData] = useState(null);

  // JSX rendering of the tool UI
  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-xl shadow-md">
      <h2 className="text-2xl font-semibold mb-4 text-center">Retirement Planning Tool</h2>

      <div className="grid grid-cols-2 gap-8">
        <div>
          <h3 className="text-xl font-semibold mb-2">Accumulation</h3>
          <label className="block">
            Current Age:
            <input
              type="number"
              name="age"
              value={formData.age}
              onChange={handleChange}
              className="w-full p-2 border rounded"
            />
            {errors.age && <p className="text-red-500 text-sm mt-1">{errors.age}</p>}
          </label>
          <label className="block">
            Current Salary:
            <input
              type="number"
              name="salary"
              value={formData.salary}
              onChange={handleChange}
              className="w-full p-2 border rounded"
            />
            {errors.salary && <p className="text-red-500 text-sm mt-1">{errors.salary}</p>}
          </label>
          <label className="block">
            Current Pot:
            <input
              type="number"
              name="currentPot"
              value={formData.currentPot}
              onChange={handleChange}
              className="w-full p-2 border rounded"
            />
            {errors.currentPot && <p className="text-red-500 text-sm mt-1">{errors.currentPot}</p>}
          </label>
          <label className="block">
            Contribution Rate (%):
            <input
              type="number"
              name="contributionRate"
              value={formData.contributionRate}
              onChange={handleChange}
              className="w-full p-2 border rounded"
            />
            {errors.contributionRate && <p className="text-red-500 text-sm mt-1">{errors.contributionRate}</p>}
          </label>
          <label className="block">
            Retirement Age:
            <input
              type="number"
              name="retirementAge"
              value={formData.retirementAge}
              onChange={handleChange}
              className="w-full p-2 border rounded"
            />
            {errors.retirementAge && <p className="text-red-500 text-sm mt-1">{errors.retirementAge}</p>}
          </label>
          <label className="block">
            Fund Selection:
            <select
              name="fundSelection"
              value={formData.fundSelection}
              onChange={handleChange}
              className="w-full p-2 border rounded"
            >
              <option>Future Advantage 1</option>
              <option>Future Advantage 2</option>
              <option>Future Advantage 3</option>
              <option>Future Advantage 4</option>
              <option>Future Advantage 5</option>
            </select>
          </label>
          <label className="block">
            Inflation Rate (%):
            <input
              type="number"
              name="inflationRate"
              value={formData.inflationRate}
              onChange={handleChange}
              className="w-full p-2 border rounded"
            />
            {errors.inflationRate && <p className="text-red-500 text-sm mt-1">{errors.inflationRate}</p>}
          </label>
        </div>
        <div>
          <h3 className="text-xl font-semibold mb-2">Decumulation</h3>
          <label className="block">
            Number of Funds:
            <select
              name="numFunds"
              value={formData.numFunds}
              onChange={handleChange}
              className="w-full p-2 border rounded"
            >
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
              <option value="4">4</option>
              <option value="5">5</option>
            </select>
            {errors.numFunds && <p className="text-red-500 text-sm mt-1">{errors.numFunds}</p>}
          </label>
          {Array.from({ length: parseInt(formData.numFunds) }, (_, i) => (
            <label key={i} className="block">
              Fund {i + 1}:
              <select
                name={`fund${i}`}
                value={formData.funds[i]}
                onChange={handleChange}
                className="w-full p-2 border rounded"
              >
                <option>Future Advantage 1</option>
                <option>Future Advantage 2</option>
                <option>Future Advantage 3</option>
                <option>Future Advantage 4</option>
                <option>Future Advantage 5</option>
              </select>
            </label>
          ))}
          <label className="block">
            Age to move to Low Risk Fund:
            <input
              type="number"
              name="ageToLowRiskFund"
              value={formData.ageToLowRiskFund}
              onChange={handleChange}
              className="w-full p-2 border rounded"
            />
            {errors.ageToLowRiskFund && <p className="text-red-500 text-sm mt-1">{errors.ageToLowRiskFund}</p>}
          </label>
          <label className="block">
            Drawdown Type:
            <select
              name="drawdownType"
              value={formData.drawdownType}
              onChange={handleChange}
              className="w-full p-2 border rounded"
            >
              <option value="percentage">Percentage</option>
              <option value="fixed">Fixed Amount</option>
              <option value="initialPot">Fixed Amount Based On Initial Pot</option>
            </select>
          </label>
          {formData.drawdownType === "percentage" ? (
            <label className="block">
              Drawdown Percentage:
              <input
                type="number"
                name="drawdownPercentage"
                value={formData.drawdownPercentage}
                onChange={handleChange}
                className="w-full p-2 border rounded"
              />
              {errors.drawdownPercentage && <p className="text-red-500 text-sm mt-1">{errors.drawdownPercentage}</p>}
            </label>
          ) : formData.drawdownType === "fixed" ? (
            <label className="block">
              Fixed Drawdown Amount (£ per month):
              <input
                type="number"
                name="drawdownFixed"
                value={formData.drawdownFixed}
                onChange={handleChange}
                className="w-full p-2 border rounded"
              />
              {errors.drawdownFixed && <p className="text-red-500 text-sm mt-1">{errors.drawdownFixed}</p>}
            </label>
          ) : (
            <label className="block">
              Initial Pot Drawdown Percentage (% per year):
              <input
                type="number"
                name="drawdownInitialPotPercentage"
                value={formData.drawdownInitialPotPercentage}
                onChange={handleChange}
                className="w-full p-2 border rounded"
              />
              {errors.drawdownInitialPotPercentage && <p className="text-red-500 text-sm mt-1">{errors.drawdownInitialPotPercentage}</p>}
            </label>
          )}
        </div>
      </div>
      <div className="mt-6 border-t pt-4">
        <h3 className="text-xl font-semibold mb-2">Fund Return Assumptions</h3>
        <table className="w-full border">
          <thead>
            <tr>
              <th className="border p-2">Fund</th>
              <th className="border p-2">Annual Return (%)</th>
              <th className="border p-2">Volatility (%)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border p-2">Future Advantage 1</td>
              <td className="border p-2">2.5%</td>
              <td className="border p-2">5.0%</td>
            </tr>
            <tr>
              <td className="border p-2">Future Advantage 2</td>
              <td className="border p-2">3.0%</td>
              <td className="border p-2">5.6%</td>
            </tr>
            <tr>
              <td className="border p-2">Future Advantage 3</td>
              <td className="border p-2">3.5%</td>
              <td className="border p-2">8.0%</td>
            </tr>
            <tr>
              <td className="border p-2">Future Advantage 4</td>
              <td className="border p-2">4.5%</td>
              <td className="border p-2">11.5%</td>
            </tr>
            <tr>
              <td className="border p-2">Future Advantage 5</td>
              <td className="border p-2">5.3%</td>
              <td className="border p-2">14.6%</td>
            </tr>
          </tbody>
        </table>
      </div>
      <button onClick={handleCalculate} className="w-full p-2 mt-4 bg-blue-500 text-white rounded">
        Run Simulation
      </button>

      {/* Accumulation Chart and Table */}
      {accumulationChartData && accumulationTableData && (
        <div className="mt-8">
          <h3 className="text-xl font-semibold mb-4">Accumulation Phase</h3>
          <div className="mb-6">
            <Line data={accumulationChartData} options={{ scales: { x: { title: { display: true, text: "Age" } }, y: { title: { display: true, text: "Pot Value (£)" } } } }} />
          </div>
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-200">
                <th className="border p-2">Percentile</th>
                <th className="border p-2">Final Pot at Retirement (£)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border p-2">25th</td>
                <td className="border p-2">{accumulationTableData.p25.toLocaleString("en-US", { maximumFractionDigits: 0 })}</td>
              </tr>
              <tr>
                <td className="border p-2">50th</td>
                <td className="border p-2">{accumulationTableData.p50.toLocaleString("en-US", { maximumFractionDigits: 0 })}</td>
              </tr>
              <tr>
                <td className="border p-2">75th</td>
                <td className="border p-2">{accumulationTableData.p75.toLocaleString("en-US", { maximumFractionDigits: 0 })}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* Decumulation Chart */}
      {decumulationChartData && (
        <div className="mt-8">
          <h3 className="text-xl font-semibold mb-4">Decumulation Phase</h3>
          <Line
            data={decumulationChartData}
            options={{
              scales: {
                x: { title: { display: true, text: "Age" } },
                y: { title: { display: true, text: "Pot Value (£)" }, stacked: true },
              },
              plugins: {
                legend: { display: true },
                tooltip: { mode: "index", intersect: false },
              },
            }}
          />
        </div>
      )}

      {/* Monthly Income Chart */}
      {monthlyIncomeChartData && (
        <div className="mt-8">
          <h3 className="text-xl font-semibold mb-4">Monthly Income in Retirement</h3>
          <p className="text-sm mb-2">
            Note: State Pension is £{STATE_PENSION_ANNUAL.toLocaleString("en-US")} per year (£{STATE_PENSION_MONTHLY.toFixed(2)} per month).
          </p>
          <Line
            data={monthlyIncomeChartData}
            options={{
              scales: {
                x: { title: { display: true, text: "Age" } },
                y: { title: { display: true, text: "Monthly Income (£)" }, stacked: true },
              },
              plugins: {
                legend: { display: true },
                tooltip: { mode: "index", intersect: false },
              },
            }}
          />
        </div>
      )}

      {/* Annual Income Chart */}
      {annualIncomeChartData && (
        <div className="mt-8">
          <h3 className="text-xl font-semibold mb-4">Annual Income in Retirement</h3>
          <p className="text-sm mb-2">
            Note: State Pension is £{STATE_PENSION_ANNUAL.toLocaleString("en-US")} per year.
          </p>
          <Line
            data={annualIncomeChartData}
            options={{
              scales: {
                x: { title: { display: true, text: "Age" } },
                y: { title: { display: true, text: "Annual Income (£)" }, stacked: true },
              },
              plugins: {
                legend: { display: true },
                tooltip: { mode: "index", intersect: false },
              },
            }}
          />
        </div>
      )}
    </div>
  );
}