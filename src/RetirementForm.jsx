import React, { useState } from "react";
import { Line } from "react-chartjs-2";
import "chart.js/auto";

export default function RetirementForm() {
  const [formData, setFormData] = useState({
    ageToLowRiskFund: "",
    lowRiskFund: "Future Advantage 1",
    secondFund: "Future Advantage 3",
    thirdFund: "Future Advantage 5",
    age: "",
    salary: "",
    currentPot: "",
    contributionRate: "",
    retirementAge: "",
    fundSelection: "Future Advantage 5",
    drawdownPercentage: "",
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: "" });
  };

  const fundData = {
    "Future Advantage 1": { return: 0.025, volatility: 0.05 },
    "Future Advantage 2": { return: 0.03, volatility: 0.0556 },
    "Future Advantage 3": { return: 0.035, volatility: 0.0799 },
    "Future Advantage 4": { return: 0.045, volatility: 0.1151 },
    "Future Advantage 5": { return: 0.053, volatility: 0.1464 },
  };

  const STATE_PENSION_ANNUAL = 11960;
  const STATE_PENSION_MONTHLY = STATE_PENSION_ANNUAL / 12; // £996.67

  const validateInputs = () => {
    const newErrors = {};
    const { age, salary, currentPot, contributionRate, retirementAge, drawdownPercentage, ageToLowRiskFund } = formData;
    const fields = [
      { name: "age", label: "Current Age", value: age },
      { name: "salary", label: "Salary", value: salary },
      { name: "currentPot", label: "Current Pot", value: currentPot },
      { name: "contributionRate", label: "Contribution Rate", value: contributionRate },
      { name: "retirementAge", label: "Retirement Age", value: retirementAge },
      { name: "drawdownPercentage", label: "Drawdown Percentage", value: drawdownPercentage },
      { name: "ageToLowRiskFund", label: "Age to Low Risk Fund", value: ageToLowRiskFund },
    ];

    for (const field of fields) {
      if (!field.value || isNaN(parseFloat(field.value))) {
        newErrors[field.name] = `${field.label} must be a valid number.`;
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return false;
    }

    const parsedAge = parseInt(age);
    const parsedRetirementAge = parseInt(retirementAge);
    const parsedSalary = parseFloat(salary);
    const parsedCurrentPot = parseFloat(currentPot);
    const parsedContributionRate = parseFloat(contributionRate);
    const parsedDrawdownPercentage = parseFloat(drawdownPercentage);
    const parsedAgeToLowRiskFund = parseInt(ageToLowRiskFund);

    if (parsedAge <= 0) newErrors.age = "Current Age must be positive.";
    if (parsedRetirementAge <= parsedAge) newErrors.retirementAge = "Retirement Age must be greater than Current Age.";
    if (parsedSalary <= 0) newErrors.salary = "Salary must be positive.";
    if (parsedCurrentPot < 0) newErrors.currentPot = "Current Pot cannot be negative.";
    if (parsedContributionRate <= 0 || parsedContributionRate > 100)
      newErrors.contributionRate = "Contribution Rate must be between 0 and 100%.";
    if (parsedDrawdownPercentage <= 0 || parsedDrawdownPercentage > 100)
      newErrors.drawdownPercentage = "Drawdown Percentage must be between 0 and 100%.";
    if (parsedAgeToLowRiskFund < parsedRetirementAge)
      newErrors.ageToLowRiskFund = "Age to Low Risk Fund must be at least the Retirement Age.";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return false;
    }

    setErrors({});
    return true;
  };

  const simulateAccumulation = () => {
    const { return: meanReturn, volatility } = fundData[formData.fundSelection];
    const years = formData.retirementAge - formData.age;
    const simulations = 1000;
    const results = [];

    for (let i = 0; i < simulations; i++) {
      let pot = parseFloat(formData.currentPot);
      let salary = parseFloat(formData.salary);
      let contributionRate = parseFloat(formData.contributionRate) / 100;
      let yearlyBalances = [];

      for (let year = 0; year < years; year++) {
        let contribution = salary * contributionRate;
        let annualReturn = meanReturn + volatility * (Math.random() * 2 - 1);
        pot = (pot + contribution) * (1 + annualReturn);
        yearlyBalances.push(pot);
      }
      results.push(yearlyBalances);
    }

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

  const simulateDecumulation = (startingPot) => {
    if (!startingPot || isNaN(startingPot) || startingPot <= 0) 
      return { lowRisk: [0], second: [0], third: [0], withdrawals: [0] };

    const lowRiskReturn = fundData[formData.lowRiskFund].return / 12;
    const secondFundReturn = fundData[formData.secondFund].return / 12;
    const thirdFundReturn = fundData[formData.thirdFund].return / 12;

    let potLowRisk = startingPot / 3;
    let potSecondFund = startingPot / 3;
    let potThirdFund = startingPot / 3;

    const drawdownRate = parseFloat(formData.drawdownPercentage) / 100 /12;
    const switchAge = parseInt(formData.ageToLowRiskFund);
    const retirementAge = parseInt(formData.retirementAge);
    const maxMonths = (100 - retirementAge) * 12;
    let age = retirementAge;
    let months = 0;
    let lowRiskBalances = [];
    let secondBalances = [];
    let thirdBalances = [];
    let withdrawals = []; // Monthly withdrawals
    let annualWithdrawals = []; // Annual totals
    let currentYearWithdrawals = 0;

    while (potLowRisk + potSecondFund + potThirdFund > 0 && months < maxMonths) {
      let withdrawal = (potLowRisk + potSecondFund + potThirdFund) * drawdownRate;
      withdrawal = Math.min(withdrawal, potLowRisk);
      potLowRisk -= withdrawal;
      currentYearWithdrawals += withdrawal;

      potLowRisk = Math.max(0, potLowRisk * (1 + lowRiskReturn));
      potSecondFund = Math.max(0, potSecondFund * (1 + secondFundReturn));
      potThirdFund = Math.max(0, potThirdFund * (1 + thirdFundReturn));

      if (months % 12 === 0 && months > 0) {
        let total = potLowRisk + potSecondFund + potThirdFund;
        potLowRisk = total / 3;
        potSecondFund = total / 3;
        potThirdFund = total / 3;
        annualWithdrawals.push(currentYearWithdrawals);
        currentYearWithdrawals = 0;
      }

      if (age >= switchAge || withdrawal * 12 > potLowRisk) {
        potLowRisk += potSecondFund + potThirdFund;
        potSecondFund = 0;
        potThirdFund = 0;
      }

      lowRiskBalances.push(potLowRisk);
      secondBalances.push(potSecondFund);
      thirdBalances.push(potThirdFund);
      withdrawals.push(withdrawal);

      if (potLowRisk + potSecondFund + potThirdFund < 1) {
        if (currentYearWithdrawals > 0) annualWithdrawals.push(currentYearWithdrawals);
        break;
      }

      months++;
      age = retirementAge + Math.floor(months / 12);
    }

    // Handle any remaining withdrawals in the final partial year
    if (currentYearWithdrawals > 0) annualWithdrawals.push(currentYearWithdrawals);

    return { lowRisk: lowRiskBalances, second: secondBalances, third: thirdBalances, withdrawals, annualWithdrawals };
  };

  const handleCalculate = () => {
    if (!validateInputs()) return;

    const { p25, p50, p75 } = simulateAccumulation();
    const decumulationResults = simulateDecumulation(p50[p50.length - 1]);

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

    const decumulationLabels = Array.from(
      { length: decumulationResults.lowRisk.length },
      (_, i) => parseInt(formData.retirementAge) + Math.floor(i / 12)
    );
    setDecumulationChartData({
      labels: decumulationLabels,
      datasets: [
        {
          label: "Low Risk Fund",
          data: decumulationResults.lowRisk,
          backgroundColor: "rgba(128, 0, 128, 0.5)",
          borderColor: "purple",
          fill: true,
        },
        {
          label: "Second Fund",
          data: decumulationResults.second,
          backgroundColor: "rgba(255, 165, 0, 0.5)",
          borderColor: "orange",
          fill: true,
        },
        {
          label: "Third Fund",
          data: decumulationResults.third,
          backgroundColor: "rgba(0, 128, 128, 0.5)",
          borderColor: "teal",
          fill: true,
        },
      ],
    });

    // Monthly Income Chart Data
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

    // Annual Income Chart Data
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

  const [accumulationChartData, setAccumulationChartData] = useState(null);
  const [accumulationTableData, setAccumulationTableData] = useState(null);
  const [decumulationChartData, setDecumulationChartData] = useState(null);
  const [monthlyIncomeChartData, setMonthlyIncomeChartData] = useState(null);
  const [annualIncomeChartData, setAnnualIncomeChartData] = useState(null); // New state for annual income chart

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
        </div>
        <div>
          <h3 className="text-xl font-semibold mb-2">Decumulation</h3>
          <label className="block">
            Low Risk, Drawdown Fund:
            <select
              name="lowRiskFund"
              value={formData.lowRiskFund}
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
            Second Fund:
            <select
              name="secondFund"
              value={formData.secondFund}
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
            Third Fund:
            <select
              name="thirdFund"
              value={formData.thirdFund}
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
        <td className="border p-2">3.6%</td>
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