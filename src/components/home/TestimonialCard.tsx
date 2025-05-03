
import React from "react";

interface TestimonialProps {
  name: string;
  text: string;
  image: string;
}

const TestimonialCard: React.FC<TestimonialProps> = ({ name, text, image }) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex items-center mb-4">
        <img 
          src={image} 
          alt={name} 
          className="h-12 w-12 rounded-full mr-4"
        />
        <div>
          <h3 className="font-semibold">{name}</h3>
          <div className="flex text-yellow-400">
            {[...Array(5)].map((_, i) => (
              <svg key={i} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            ))}
          </div>
        </div>
      </div>
      <p className="text-gray-600">{text}</p>
    </div>
  );
};

export default TestimonialCard;
