#!/bin/bash
npm run generate-api
sed -i 's/award_type: number/award_type: AwardType/g' app/api/v3.ts
sed -i 's/event_type: number/event_type: EventType/g' app/api/v3.ts
sed -i '1i\
import { AwardType } from '"'"'~/lib/api/AwardType'"'"';\
import { EventType } from '"'"'~/lib/api/EventType'"'"';' app/api/v3.ts
npm run format:fix
