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

## Red Bull 2026 draft

Source references: `SI202601150724.webp`, `SI202601150722.webp`, `SI202601150725.webp`, `SI202601150723.webp`, and `SI202601150740.webp`, supplied by the user on 29 September 2026.

Status: local source saved and Sites showroom preview prepared; awaiting approval before GitHub commit. The incorrect 2025 Red Bull paint has been removed. Runtime numbers 3 and 6 use the same constructor paint, with corrected top/side lettering and opaque showroom materials.

The shared chassis approximates bodywork. The launch scheme uses glossy patterned blue, exposed carbon, yellow nose/airbox, white-edged red bull graphics, Oracle, Ford, Visa, Gate, and other sponsor approximations. Bull silhouettes and sponsor type are authored approximations, not official vector artwork.

## Alpine 2026 preview
A526 paint study reconstructed from five supplied launch references. Shared chassis; sponsor shapes and placement are approximate. Driver numbers 10 and 43 are independent runtime inputs. Both showroom cars remain opaque with isolated materials. Approved for GitHub on 29 September 2026. Preview: `/src/showroom/index.html?car=alpine-2026`.

Red Bull preview correction (29 September 2026): fit the bull below the air-intake opening, slope its placement to follow the cover, retain side projection over the engine-cover curvature, and place Ford Racing on the rear cover clear of the Red Bull wordmark. Both sides face the bull forward. Approved for GitHub on 29 September 2026.
