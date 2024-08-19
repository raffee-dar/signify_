document
  .getElementById("fileInput")
  .addEventListener("change", handleFileSelect, false);

function handleFileSelect(event) {
  const file = event.target.files[0];
  if (file) {
    Papa.parse(file, {
      header: true,
      dynamicTyping: true,
      complete: function (results) {
        processData(results.data);
      },
    });
  }
}

function processData(data) {
  const columnToSearch = "Target Experiences";
  const columnsToRetrieve = [
    "Web Prospects Overall | V | GROUP | ALL",
    "New Vehicle Web Requests | H | GROUP | ALL",
  ];
  const visitsColumn = "Visits";

  // Create a map to store the processed data
  const experienceData = data.reduce((acc, row) => {
    const experience = row[columnToSearch];
    if (!experience) return acc;

    if (!acc[experience]) {
      acc[experience] = { totalVisits: 0, kpis: {} };
    }

    acc[experience].totalVisits += row[visitsColumn];
    columnsToRetrieve.forEach((col) => {
      acc[experience].kpis[col] = (acc[experience].kpis[col] || 0) + row[col];
    });

    return acc;
  }, {});

  // Extract unique experiences and find baseline experience
  const uniqueExperiences = Object.keys(experienceData);
  const baselineExperience = uniqueExperiences.find((exp) =>
    exp.includes("A:")
  );
  console.log(baselineExperience);

  // Calculate conversion rates
  const conversionRates = uniqueExperiences.reduce((acc, experience) => {
    const { totalVisits, kpis } = experienceData[experience];
    acc[experience] = {};
    columnsToRetrieve.forEach((col) => {
      const kpiValue = kpis[col];
      const conversionRate =
        totalVisits > 0 ? (kpiValue / totalVisits) * 100 : null;
      acc[experience][col] = conversionRate;
    });
    return acc;
  }, {});

  // Display results
  displayResults(conversionRates, columnsToRetrieve, baselineExperience);
}

function displayResults(
  conversionRates,
  columnsToRetrieve,
  baselineExperience
) {
  const outputDiv = document.getElementById("output");
  let outputHTML = "";

  if (baselineExperience && conversionRates[baselineExperience]) {
    columnsToRetrieve.forEach((col) => {
      const cr_a = conversionRates[baselineExperience][col];
      outputHTML += `<h3>Uplift in terms of <span style="font-size:13px"> ${col}</span> compared to<span style="font-size:13px"> ${baselineExperience}:</span></h3>`;
      Object.keys(conversionRates).forEach((value) => {
        if (value !== baselineExperience) {
          const cr_b = conversionRates[value][col];
          const uplift = cr_a !== null ? ((cr_b - cr_a) / cr_a) * 100 : null;
          outputHTML += `<p>${value}: ${
            uplift !== null ? uplift.toFixed(2) + "%" : "No data"
          }</p>`;
        }
      });
    });
  } else {
    outputHTML = `Baseline experience '${
      baselineExperience || "not found"
    }' not found in the data.`;
  }

  outputDiv.innerHTML = outputHTML;
}
