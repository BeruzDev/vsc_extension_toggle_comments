// Base variables to calculate the volume
const height = 12;
const radius = 5;

// Function to calculate the area of a circle
function calculateCircleArea(r) {
    return Math.PI * r * r; // <- Circle area
}

// Function to calculate the volume of a cylinder
function calculateCylinderVolume(h, r) {
    const baseArea = calculateCircleArea(r); // <- Cylinder base
    return baseArea * h; // <- Cylinder height * base area
}

/* Prints the cylinder volume result 
in the console with the specified 
radius and height */
console.log(
    `The volume of the cylinder is:
    ${calculateCylinderVolume(height, radius)}`
);
