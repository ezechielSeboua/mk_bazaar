import React, { useState } from 'react';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';

export default function ImageCarousel({ images = [] }) {
  const [current, setCurrent] = useState(0);

  if (!images.length) {
    return <div className="bg-gray-200 w-full h-96 rounded flex items-center justify-center">No image</div>;
  }

  const next = () => setCurrent((current + 1) % images.length);
  const prev = () => setCurrent((current - 1 + images.length) % images.length);

  return (
    <div className="relative">
      <img
        src={images[current].path}
        alt={images[current].alt_text || 'Product image'}
        className="w-full h-96 object-cover rounded"
      />

      {images.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70"
          >
            <ChevronLeft />
          </button>
          <button
            onClick={next}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70"
          >
            <ChevronRight />
          </button>

          {/* Thumbnails */}
          <div className="flex gap-2 mt-4">
            {images.map((img, idx) => (
              <button
                key={idx}
                onClick={() => setCurrent(idx)}
                className={`w-16 h-16 rounded overflow-hidden border-2 ${
                  idx === current ? 'border-orange-500' : 'border-gray-200'
                }`}
              >
                <img src={img.path} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
