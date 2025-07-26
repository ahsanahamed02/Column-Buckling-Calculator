const unitConverters = {
  length: { 
    m: v => v, 
    cm: v => v / 100, 
    mm: v => v / 1000, 
    in: v => v * 0.0254 
  },
  modulus: { 
    GPa: v => v * 1e9, 
    MPa: v => v * 1e6 
  },
  inertia: { 
    m4: v => v, 
    cm4: v => v * 1e-8, 
    mm4: v => v * 1e-12 
  },
  area: { 
    m2: v => v, 
    cm2: v => v * 1e-4, 
    mm2: v => v * 1e-6 
  },
  stress: { 
    MPa: v => v * 1e6, 
    Pa: v => v 
  }
};

function convert(val, cat, unit) {
  return unitConverters[cat][unit](val);
}

// Format with proper power notation (e.g., 10³ instead of 10^3)
function formatPower(value, decimals=3) {
  if (value === 0) return "0";
  
  const absValue = Math.abs(value);
  const exp = Math.floor(Math.log10(absValue));
  const mantissa = value / Math.pow(10, exp);
  
  // Use power notation if abs exponent ≥3
  if (exp >= 3 || exp <= -3) {
    const superscripts = {'0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', 
                         '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹', '-': '⁻'};
    const expStr = exp.toString().split('').map(c => superscripts[c] || c).join('');
    return `${mantissa.toFixed(decimals)}×10${expStr}`;
  } else {
    return value.toFixed(decimals);
  }
}

const form = document.getElementById('bucklingForm');
const resultDiv = document.getElementById('result');

form.addEventListener('submit', e => {
  e.preventDefault();
  calculateBuckling();
});

function calculateBuckling() {
  const Lval = +document.getElementById('length').value;
  const Eval = +document.getElementById('modulus').value;
  const Ival = +document.getElementById('inertia').value;
  const Aval = +document.getElementById('area').value;
  const sigmaYval = +document.getElementById('yieldStress').value;

  if ([Lval, Eval, Ival, Aval, sigmaYval].some(v => isNaN(v) || v <= 0)) {
    showError("Please fill all fields with positive numbers!");
    return;
  }

  const Lunit = document.getElementById('lengthUnit').value;
  const Eunit = document.getElementById('modulusUnit').value;
  const Iunit = document.getElementById('inertiaUnit').value;
  const Aunit = document.getElementById('areaUnit').value;
  const sigmaYunit = document.getElementById('yieldStressUnit').value;

  const L = convert(Lval, 'length', Lunit);
  const E = convert(Eval, 'modulus', Eunit);
  const I = convert(Ival, 'inertia', Iunit);
  const A = convert(Aval, 'area', Aunit);
  const K = +document.getElementById('endCondition').value;
  const sigmaY = convert(sigmaYval, 'stress', sigmaYunit);


  const r = Math.sqrt(I / A);
  const Le = K * L;
  const slendernessRatio = Le / r;
  const Pcr = Math.PI ** 2 * E * I / (Le ** 2);
  const Py = sigmaY * A;
  const FoS = Py / Pcr;

  let safetyStatus, safetyClass;
  if (FoS >= 2) {
    safetyStatus = "Very Safe (FoS ≥ 2)";
    safetyClass = "safe";
  } else if (FoS >= 1) {
    safetyStatus = "Safe (1 ≤ FoS < 2)";
    safetyClass = "safe";
  } else if (FoS >= 0.8) {
    safetyStatus = "Marginally Unsafe (0.8 ≤ FoS < 1)";
    safetyClass = "warning";
  } else {
    safetyStatus = "Unsafe (FoS < 0.8)";
    safetyClass = "unsafe";
  }

  const resultHTML = `
    <div class="section-title">Input Parameters</div>
    <div class="result-item">
      <span class="result-label">Length (L):</span>
      <span class="result-value">${Lval} ${Lunit}</span>
    </div>
    <div class="result-item">
      <span class="result-label">Modulus (E):</span>
      <span class="result-value">${Eval} ${Eunit}</span>
    </div>
    <div class="result-item">
      <span class="result-label">Moment of Inertia (I):</span>
      <span class="result-value">${Ival} ${Iunit}</span>
    </div>
    <div class="result-item">
      <span class="result-label">Area (A):</span>
      <span class="result-value">${Aval} ${Aunit}</span>
    </div>
    <div class="result-item">
      <span class="result-label">End Condition:</span>
      <span class="result-value">${document.getElementById('endCondition').options[document.getElementById('endCondition').selectedIndex].text}</span>
    </div>
    <div class="result-item">
      <span class="result-label">Yield Stress (σ<sub>Y</sub>):</span>
      <span class="result-value">${sigmaYval} ${sigmaYunit}</span>
    </div>

    <div class="section-title">Buckling Results</div>
    <div class="result-item">
      <span class="result-label">Radius of Gyration (r):</span>
      <span class="result-value">${formatPower(r)} m</span>
    </div>
    <div class="result-item">
      <span class="result-label">Effective Length (L<sub>e</sub>):</span>
      <span class="result-value">${formatPower(Le)} m (K = ${K})</span>
    </div>
    <div class="result-item">
      <span class="result-label">Slenderness Ratio (λ):</span>
      <span class="result-value">${formatPower(slendernessRatio)}</span>
    </div>
    <div class="result-item">
      <span class="result-label">Critical Load (P<sub>cr</sub>):</span>
      <span class="result-value">${formatPower(Pcr)} N (${formatPower(Pcr/1000)} kN)</span>
    </div>
    <div class="result-item">
      <span class="result-label">Yield Load (P<sub>y</sub>):</span>
      <span class="result-value">${formatPower(Py)} N (${formatPower(Py/1000)} kN)</span>
    </div>
    <div class="result-item">
      <span class="result-label">Factor of Safety:</span>
      <span class="result-value ${safetyClass}">${FoS.toFixed(3)} - ${safetyStatus}</span>
    </div>
  `;
  
  resultDiv.innerHTML = resultHTML;
  resultDiv.scrollIntoView({ behavior: 'smooth' });
}

function showError(message) {
  resultDiv.innerHTML = `<div class="result-item" style="color: var(--error);">${message}</div>`;
  resultDiv.scrollIntoView({ behavior: 'smooth' });
}

document.getElementById('darkModeToggle').onclick = () => {
  if (document.documentElement.hasAttribute('data-theme')) {
    document.documentElement.removeAttribute('data-theme');
    localStorage.setItem('theme', 'light');
  } else {
    document.documentElement.setAttribute('data-theme', 'dark');
    localStorage.setItem('theme', 'dark');
  }
};

if (localStorage.getItem('theme') === 'dark') {
  document.documentElement.setAttribute('data-theme', 'dark');
}

document.getElementById('exportPdf').onclick = () => {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("Column Buckling Analysis Report", 105, 15, { align: 'center' });
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 105, 22, { align: 'center' });

  doc.setFontSize(12);
  doc.setFont(undefined, 'bold');
  doc.text("Input Parameters:", 14, 35);
  doc.setFont(undefined, 'normal');
  
  const inputs = [
    `Length (L): ${document.getElementById('length').value || 'N/A'} ${document.getElementById('lengthUnit').value}`,
    `Modulus (E): ${document.getElementById('modulus').value || 'N/A'} ${document.getElementById('modulusUnit').value}`,
    `Moment of Inertia (I): ${document.getElementById('inertia').value || 'N/A'} ${document.getElementById('inertiaUnit').value}`,
    `Area (A): ${document.getElementById('area').value || 'N/A'} ${document.getElementById('areaUnit').value}`,
    `End Condition: ${document.getElementById('endCondition').options[document.getElementById('endCondition').selectedIndex].text}`,
    `Yield Stress (σY): ${document.getElementById('yieldStress').value || 'N/A'} ${document.getElementById('yieldStressUnit').value}`
  ];

  inputs.forEach((item, i) => {
    doc.text(item, 20, 45 + i * 7);
  });

  if (resultDiv.textContent.includes("Radius of Gyration")) {
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text("Buckling Results:", 14, 95);
    doc.setFont(undefined, 'normal');
    
    const results = resultDiv.textContent.split('\n')
      .filter(line => line.trim() !== '' && !line.includes('Input Parameters') && !line.includes('Buckling Results'))
      .map(line => line.replace(/\s+/g, ' ').trim());
    
    results.forEach((item, i) => {
      doc.text(item, 20, 105 + i * 7);
    });
  }

  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text("Generated by Column Buckling Calculator - Created by R.Ahsan Ahamed", 105, 285, { align: 'center' });

  doc.save("Buckling_Analysis_Report.pdf");
};

document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    
    tab.classList.add('active');
    document.getElementById(tab.dataset.tab).classList.add('active');
  });
});

document.getElementById('loadSteelExample').addEventListener('click', () => {
  document.getElementById('length').value = 3;
  document.getElementById('lengthUnit').value = 'm';
  document.getElementById('modulus').value = 200;
  document.getElementById('modulusUnit').value = 'GPa';
  document.getElementById('inertia').value = 9.6e6;
  document.getElementById('inertiaUnit').value = 'mm4';
  document.getElementById('area').value = 2850;
  document.getElementById('areaUnit').value = 'mm2';
  document.getElementById('endCondition').value = '1';
  document.getElementById('yieldStress').value = 250;
  document.getElementById('yieldStressUnit').value = 'MPa';
  
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
  document.querySelector('.tab[data-tab="calculator"]').classList.add('active');
  document.getElementById('calculator').classList.add('active');
  
  showError("Steel example loaded. Click Calculate to see results.");
});

document.getElementById('loadAluminumExample').addEventListener('click', () => {
  document.getElementById('length').value = 2.5;
  document.getElementById('lengthUnit').value = 'm';
  document.getElementById('modulus').value = 69;
  document.getElementById('modulusUnit').value = 'GPa';
  document.getElementById('inertia').value = 1.3e5;
  document.getElementById('inertiaUnit').value = 'mm4';
  document.getElementById('area').value = 564;
  document.getElementById('areaUnit').value = 'mm2';
  document.getElementById('endCondition').value = '0.7';
  document.getElementById('yieldStress').value = 240;
  document.getElementById('yieldStressUnit').value = 'MPa';
  
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
  document.querySelector('.tab[data-tab="calculator"]').classList.add('active');
  document.getElementById('calculator').classList.add('active');
  
  showError("Aluminum example loaded. Click Calculate to see results.");
});
