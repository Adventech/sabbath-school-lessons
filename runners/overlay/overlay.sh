#!/bin/bash

# Check if the required arguments are provided
if [ -z "$1" ] || [ -z "$2" ] || [ -z "$3" ]; then
  echo "Usage: $0 [square|landscape] [overlay_image] [output_directory]"
  exit 1
fi

# Define input parameters and images based on the first argument
if [ "$1" = "square" ]; then
  background_image="./runners/overlay/square.png"
  output_image="$3/cover-square.png"
elif [ "$1" = "landscape" ]; then
  background_image="./runners/overlay/landscape.png"
  output_image="$3/cover-landscape.png"
else
  echo "Invalid option. Please use 'square' or 'landscape'."
  exit 1
fi

# Overlay image is the second parameter
overlay_image="$2"

# Check if the overlay image exists
if [ ! -f "$overlay_image" ]; then
  echo "Overlay image '$overlay_image' does not exist."
  exit 1
fi

# Check if the output image already exists
if [ -f "$output_image" ]; then
  echo "Output image '$output_image' already exists. Skipping generation."
  exit 0
fi


# Padding in pixels
padding=40

# Get the dimensions of the background image
background_height=$(identify -format "%h" "$background_image")

# Calculate the new height for the overlay (subtracting top and bottom padding)
new_overlay_height=$((background_height - 2 * padding))

# Resize the overlay to fit the calculated height, maintaining the aspect ratio
magick "$overlay_image" -resize x"$new_overlay_height" resized_overlay.png

# Composite the resized overlay onto the background with padding applied (gravity center for horizontal centering)
magick "$background_image" resized_overlay.png -gravity north -geometry +0+"$padding" -composite "$output_image"

# Clean up temporary resized image
rm resized_overlay.png

#imageoptim -S --speed 1 "$output_image"
#optipng -o2 "$output_image"  # Max compression for PNG files

echo "Image generated: $output_image"
