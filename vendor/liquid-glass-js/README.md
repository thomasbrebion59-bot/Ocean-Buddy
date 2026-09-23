# Liquid Glass JS — bibliothèque intégrée

Source : https://github.com/dashersw/liquid-glass-js
Licence : MIT (voir LICENSE)
Version source : commit 78cb6ccb0b9987bb60a88b14ccbd13a9e6e8ab2a

Cette bibliothèque JavaScript sans étape de compilation dessine des composants en verre réfractif avec WebGL 2. Elle convient au site statique JavaScript d’Ocean Buddy et peut aussi être adaptée à un thème Shopify.

## Fichiers

- `container.js` et `button.js` : composants `Container` et `Button`
- `glass.css` : styles des composants
- `LICENSE` : licence MIT d’origine

## Dépendance navigateur

La bibliothèque utilise html2canvas pour capturer le fond de la page. Le guide amont charge html2canvas 1.4.1 depuis jsDelivr. Pour éviter de charger un script tiers sur toutes les pages, ne l’ajouter qu’aux écrans qui utilisent l’effet, ou le servir localement. WebGL 2 est requis.

## Exemple

À charger dans cet ordre sur une page de démonstration ou un écran ciblé :

```html
<link rel="stylesheet" href="vendor/liquid-glass-js/glass.css">
<script src="https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js"></script>
<script src="vendor/liquid-glass-js/container.js"></script>
<script src="vendor/liquid-glass-js/button.js"></script>
```

Puis créer le bouton après le chargement :

```js
const glassButton = new Button({
  text: 'Explorer',
  size: 18,
  type: 'pill',
  tintOpacity: 0.24,
  onClick: () => {
    // Appeler ici l’action existante du bouton
  }
});
document.querySelector('.actions').appendChild(glassButton.element);
```

Garder un style de secours lisible si WebGL 2 est indisponible, et limiter l’effet à quelques éléments visibles pour préserver les performances mobiles.

