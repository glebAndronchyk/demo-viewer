## Retrieve data from user
- Ask for steamidkey
- Ask for latest knowncode
- Append steamidkey and latest knowncode to user in db
- ~~Create lock on db for writing the knowncode~~
- Run the parsing each n minutes (check the domain data)

## Parse new demos job
- Check if current available code has been parsed
- Should call steam and get next available share code
- Update user next available share code
- Decode next available shared code
- Call Game Coordinator with the decoded match id
- Receive the path to demo
- Parse the demo from stdin
    
