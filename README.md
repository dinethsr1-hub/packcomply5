# PackComply V5 — Multi-market export compliance starter

This version expands the free screening workflow to multiple products and destination markets while preventing unsupported markets from being presented as fully covered.

## Products in the catalog
Cinnamon, Tea, Coconut products, Coffee, General spices, Mushrooms/mushroom powder, beverages, fruits, vegetables, processed foods, seafood, fish products, dairy, cosmetics, chemicals, textiles, rubber, electronics and other products.

## Destination catalog
Germany, France, Netherlands, Italy, Spain, Belgium, Poland, Sweden, Denmark, Austria, Ireland, United Kingdom, United States, Canada, Australia, Japan, China, Saudi Arabia, United Arab Emirates, India, Qatar, Kuwait, Oman, Bahrain and New Zealand.

## Verified starter coverage in this build
EU food products: EU food information/labelling, pesticide MRL screening, contaminants, food-contact materials, plastic food-contact materials, food-contact GMP and PPWR screening.
Germany: LUCID/packaging EPR screening.
UK: food import/labelling starter screening and packaging EPR screening.
USA: FDA food import starter screening.
Canada: SFCR food import starter screening.
Australia: Food Standards Code/imported food starter screening.
Japan: Food Sanitation Act import notification starter screening.
China: imported prepacked food Chinese-labelling starter screening.
Saudi Arabia: SFDA food-import starter screening.

Some countries are listed for future expansion but are explicitly marked as not loaded. The app will not call those markets fully covered.

## Deployment
The package keeps the simple Express structure used by the working baseline. For Vercel, use the same deployment configuration that is already working for the current project; do not mix multiple server structures.

## Important
A matched rule means the topic should be reviewed; it does not mean the shipment is compliant. Actual applicability can depend on HS code, formulation, origin, importer role, intended use, sales channel and current law. This is not legal advice or certification.
