
/* Custom Engineering Aesthetics */
@keyframes slideIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.animate-slide-in {
  animation: slideIn 0.4s ease-out forwards;
}

/* Custom range slider thumb styling */
input[type=range]::-webkit-slider-thumb {
  -webkit-appearance: none;
  height: 18px;
  width: 18px;
  border-radius: 50%;
  background: #2563eb;
  cursor: pointer;
  box-shadow: 0 0 10px rgba(37, 99, 235, 0.3);
  border: 2px solid white;
  margin-top: -5px;
}

input[type=range]::-webkit-slider-runnable-track {
  width: 100%;
  height: 8px;
  cursor: pointer;
  background: #e2e8f0;
  border-radius: 4px;
}

/* Print Styles */
@media print {
  body {
    background: white !important;
  }
  .print\:hidden {
    display: none !important;
  }
  main {
    margin-top: 0 !important;
    padding: 0 !important;
  }
  .lg\:col-span-8 {
    grid-column: span 12 / span 12 !important;
  }
  .container {
    max-width: 100% !important;
    width: 100% !important;
  }
  .shadow-sm, .shadow-md, .shadow-lg, .shadow-xl {
    box-shadow: none !important;
    border: 1px solid #e2e8f0 !important;
  }
}
