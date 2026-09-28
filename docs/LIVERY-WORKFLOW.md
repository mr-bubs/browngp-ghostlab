# Livery approval workflow

For McLaren 2026 and all subsequently supplied constructor references:

1. Recreate the paint in `cars/liveries/<year>/<constructor>.js` and register the car locally.
2. Keep driver numbers as runtime inputs. Do not bake a fixed driver number into constructor paint.
3. Show the user a rendered preview. Keep the change local until the user explicitly approves a GitHub commit.
4. Check top, both sides and three-quarter angles. Top decals must face the correct direction; side lettering and symbols must not mirror. Check number and logo rotation separately.
5. Display each showroom car with `comparisonIndex: null`. Both driver variants must be opaque and depth-writing. Ghost opacity is only for replay comparisons.
6. After approval, commit the livery, registry entry, showroom support and relevant provenance together. Give the user the commit SHA.

## McLaren 2026 draft

Source references: `MCL40_A_Social_1920x1080.webp`, `MCL40_C_LN_Social_1920x1080.webp`, `MCL40_LN_Allwyn_right_front_3Q.webp`, and `MCL40_LN_Allwyn_side_right.webp`, supplied by the user on 28 September 2026.

Status: website preview approved by the user on 29 September 2026; approved for GitHub commit. The paint recreates the MCL40's papaya, black and teal scheme on the existing shared chassis. Sponsor marks and their positions are approximate; exact MCL40 bodywork and its wheel graphics are not modeled.
