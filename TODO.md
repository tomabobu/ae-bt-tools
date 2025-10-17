Bezier Tangents:
# Add functionality to copy values of selected keys and paste values (EaseCopy)
# Add alert if graph has overshoot and properties are not separated
# Add option to selec just one keyframe 
# Add shortcuts for easy copy and paste


Color Swatches:
# start with Library Management folded
# add checkbox to calculate size so that the group with the most swatches fits to panel width

Guide Generator:
# Save the name of the composition while initializing and when UI updates, switch to that composition and refresh guides

Modals:
# change padding when panel width is small (responsive adjust)

Other modules:
# add down arrow at the right end of the modules tans to show a menu with all the modules


# Create module to offset keys/layers (Rift plugin) based on curve and total offset
Create a new module called timeOffset that will be used to offset/arrange in time, selected keys or layers.
 
The distribution in time is done on the following parameters: 
- ascending or descending (radio group with only one of the two selected at a time)
- align at start or end (if layers are selected the in/out point is aligned, if keyframes are selected the first/last keyframe are aligned) (radio group with one of the two selected at a time)
- the time offset (the difference between the first and the last keys/layers) - numeric input that can have negative numbers and with the dafault value 0 (the input field should use the dragToAdjust and spinners like the input fields from the guideGenerator module)
- an instance of the cubic-bezier curve editor that will define the profile (in a liniar profile the difference between between the element will be equal) 
- randomize offset min and max values and a random seed (default 0) will define a random offset (to the left used the min value, to the right uses the max value). The randomize offset should be additive on top of the offsets calculated with the above parameters (if both min and max random offsets are 0, the randomize offset should have no effect)
- an "Offset" button that will save the selection, will calculate the offsets and will apply them
- an "Interactive" button that will trigger an interactive sesion where changes in the UI will trigger the recalculation of the offsets and the update in the composition (the initial positions and selection is saved when the interactive sesion is triggered). While in the interactive session, the "Interactive" button is replaced by two buttons "Apply" (leaved the offsets as calculated and returns to the initial UI) and "Cancel" (restores the initial position and restores the initial UI)


Examples:
- if a couple of layers are selected with: the order acending, align at start, offset 100, the curve editor as a liniar interpolation the script sould aling the in point starting from the one at the bottom (the inpoint of the most bottom layer stays in place) and offsets each layer from bottom to top with a constant number of frames such that the difference between the first and the last is 100 frame 
- if keyframes for different layers are selected with: order descending, align at end, offset -100, the curve editor as a ease in/out interpolation, the script should move the selected keframes from the same layer as a block, starting form the top, and aligns the last keyframe such that in the end the profile of the offsets will match the curve editor, and the difference between the top and the last layer is -100 frames (the offset is negative in time)
- if both keyframes and layers are selected - show an error message to select only keframes or only layers



   - scale the keys by a certain percent starting from the start, end as a group or split by layers 
   - snap positions to frames (whole numbers)
   - copy mirror selected keys, mirror flip, copy 
   - multi copy/paste values, multi copy/paste ease

# sort selected layers based on anchor points position (from left to right...)
- linear based on direction

# connection, Loopy style expressions to loop animations
# Create module for shape management: explode shapes, set pivot point
# Module for gradients library
# Create module to align multiple selection ("Layout" from PluginPlay), distribute groups (dynamic calculate groups based on overlapping bounding box), set distance between groups, distribute into grids (circular or rect back for cells -  fit, fill,), colage from input image to fill/distribute into shape
# Create module to flex distribute into lines and grids (Flex plugin)



