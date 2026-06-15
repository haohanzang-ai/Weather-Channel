function calcFuel() {
  var gallons = parseFloat(document.getElementById('calcGallons').value) || 0;
  var price   = parseFloat(document.getElementById('calcPrice').value)   || 0;
  var pct     = parseFloat(document.getElementById('calcReplace').value) || 0;
  if (gallons < 0) gallons = 0;
  if (price < 0) price = 0;
  if (pct < 0) pct = 0;
  if (pct > 100) pct = 100;
  var weeklyCost   = gallons * price;
  var replacedGal  = gallons * (pct / 100);
  var remainingGal = gallons - replacedGal;
  document.getElementById('resultCost').textContent      = '$' + weeklyCost.toFixed(2);
  document.getElementById('resultGallons').textContent   = replacedGal.toFixed(1) + ' gal';
  document.getElementById('resultRemaining').textContent = remainingGal.toFixed(1) + ' gal';
}

document.addEventListener('DOMContentLoaded', function () {
  ['calcGallons', 'calcPrice'].forEach(function (id) {
    var el = document.getElementById(id);
    if (el) el.addEventListener('input', calcFuel);
  });
  calcFuel();
});
