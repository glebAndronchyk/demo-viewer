# Block Schema: DownloadAndParseDemoCommandHandler

## Context

Classic block diagram (flowchart) of the algorithm inside `DownloadAndParseDemoCommandHandler`. No code changes required.

---

## Algorithm Block Diagram

```mermaid
flowchart TD
    START([START\nuserId, userSteamId\nuserSteamIdKey, lastKnownShareCode])

    getNextCode[gameCoordinatorRepository\n.getNextAvailableShareCode\nuserSteamId, userSteamIdKey, lastKnownShareCode]
    checkNextCode{isSuccess?}
    throwNextCode[THROW error]
    assignNextCode[nextCode = result.data.nextCode]

    updateShareCode[userRepository\n.updateKnownShareCode\nuserId, nextCode]

    getMatchUrl[gameCoordinatorRepository\n.getMatchUrlById\nnextCode]
    checkMatchUrl{isSuccess?}
    throwMatchUrl[THROW error]
    assignUrl[url = result.data.url]

    findMatch[matchRepository\n.findByShareCode\nnextCode]
    checkMatchExists{match exists?}

    logSkip[LOG: already parsed, skipping]
    returnNull([RETURN\n url: null])

    pingUrl[gameCoordinatorRepository\n.pingMatchUrl\nurl]
    checkPing{isSuccess?}
    throwPing[THROW DomainUnavailableError]

    enqueue[queue.enqueue\n parserRepository.parseDemoFromRemote\n url, nextCode .promise]
    returnUrl([RETURN\n url])

    END([END])

    START --> getNextCode
    getNextCode --> checkNextCode
    checkNextCode -- NO --> throwNextCode
    checkNextCode -- YES --> assignNextCode
    assignNextCode --> updateShareCode
    updateShareCode --> getMatchUrl
    getMatchUrl --> checkMatchUrl
    checkMatchUrl -- NO --> throwMatchUrl
    checkMatchUrl -- YES --> assignUrl
    assignUrl --> findMatch
    findMatch --> checkMatchExists
    checkMatchExists -- YES --> logSkip
    checkMatchExists -- NO --> pingUrl
    logSkip --> returnNull
    pingUrl --> checkPing
    checkPing -- NO --> throwPing
    checkPing -- YES --> enqueue
    enqueue --> returnUrl
    returnNull --> END
    returnUrl --> END
```

---

## Error Paths Summary

| Step | Condition | Action |
|------|-----------|--------|
| getNextAvailableShareCode | `!isSuccess` | throw error |
| getMatchUrlById | `!isSuccess` | throw error |
| findByShareCode | match exists | return `{ url: null }` (normal skip path) |
| pingMatchUrl | `!isSuccess` | throw `DomainUnavailableError` |

---

## Files Referenced

- `backend/domain/src/handlers/DownloadAndParseDemoCommandHandler.ts`
- `backend/domain/src/ports/outbound/` — `GameCoordinatorOutboundPort`, `MatchOutboundPort`, `UserOutboundPort`, `ParserOutboundPort`, `QueueOutboundPort`
