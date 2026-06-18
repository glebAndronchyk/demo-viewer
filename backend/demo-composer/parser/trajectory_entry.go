package parser

import "github.com/markus-wa/demoinfocs-golang/v5/pkg/demoinfocs/common"

type SerializableTrajectoryEntry struct {
	tick     int
	position Vector3
	frameId  int
}

func DegradeTrajectoryArray(arr []common.TrajectoryEntry, take int) []SerializableTrajectoryEntry {
	copy := []SerializableTrajectoryEntry{}

	for i := 0; i < len(arr); i++ {
		if i%take == 0 {
			copy = append(copy, SerializableTrajectoryEntry{
				tick: arr[i].Tick,
				position: Vector3{
					X: arr[i].Position.X,
					Y: arr[i].Position.Y,
					Z: arr[i].Position.Z,
				},
				frameId: arr[i].FrameID,
			})
		}
	}

	return copy
}
