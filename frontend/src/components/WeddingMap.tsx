import './WeddingMap.css'

// д. Брод, ул. Гагарина 50
const LNG = 61.836058
const LAT = 56.415939

const MAP_URL = `https://yandex.ru/map-widget/v1/?ll=${LNG},${LAT}&z=15&l=map&pt=${LNG},${LAT}`

export function WeddingMap() {
  return (
    <iframe
      className="wedding-map"
      src={MAP_URL}
      title="Карта: База отдыха «Ровесник», д. Брод, ул. Гагарина 50"
      allowFullScreen
    />
  )
}
