# Teams Management

## User stories

### Team Member Stories

~~- As a team member, I want to be able to check compatibility between other players on different maps;~~
~~- As a team member, I want to be able to check the problematic zones of a selected map;~~

### Team Owner Stories

> The team owner functionality extends the team member functionality described above:

- As a team owner, I want to be able to invite members to my team (group);
- As a team owner, I want to be able to change the visibility/openness of my group;
- As a team owner, I want to be able to edit my team's information;
- As a team owner, I want to be able to remove users from the team;
~~- As a team owner, I want to be able to upload demo files that will be taken into account in the calculation of team statistics;~~

### Security

- Team admin endpoint should check user auth and identity, before performing any actions related to changing team data;
- Always verify that person is the part of team before performing any data querying.
