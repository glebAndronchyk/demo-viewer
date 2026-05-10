import type { PlayerUtilityDto } from "@demo-viewer/shared-types";
import { Flex, Row, Col } from "antd";
import { Bar } from "@ant-design/plots";

interface GrenadesUsageProps {
  grenadesUsage: PlayerUtilityDto;
}

export const GrenadesUsage = (props: GrenadesUsageProps) => {
  const {
    flashesThrown = 0,
    incendiariesThrown = 0,
    enemiesFlashed = 0,
    teammatesFlashed = 0,
    grenadesThrown = 0,
    flashDuration = 0,
    heThrown = 0,
    molotovsThrown = 0,
    molotovsDamage = 0,
    heDamage = 0,
    smokesThrown = 0,
    flashSuccessRate = 0,
    heSuccessRate = 0,
    fireSuccessRate = 0,
  } = props.grenadesUsage;

  const toBar = (type: string, rate: number) => [
    { type, direction: "Success", value: rate },
    { type, direction: "Failure", value: -(1 - rate) },
  ];

  const data = [
    ...toBar("Flash", flashSuccessRate ?? 0),
    ...toBar("HE", heSuccessRate ?? 0),
    ...toBar("Fire", fireSuccessRate ?? 0),
  ];

  return (
    <div>
      <p>Total grenades thrown: {grenadesThrown}</p>
      <Flex orientation="vertical" gap={4} className="border">
        <Row>
          <Col span={GrenadesUsage.COL_SPAN}>Flashbangs</Col>
          <Col span={GrenadesUsage.COL_SPAN}>Thrown: {flashesThrown}</Col>
          <Col span={GrenadesUsage.COL_SPAN}>
            Teammates flashed &darr;: {teammatesFlashed}
          </Col>
          <Col span={GrenadesUsage.COL_SPAN}>
            Enemies flashed &uarr;: {enemiesFlashed}
          </Col>
          <Col span={GrenadesUsage.COL_SPAN}>
            Success rate: {flashSuccessRate}
          </Col>
          <Col span={GrenadesUsage.COL_SPAN}>
            Total flash duration: {flashDuration}
          </Col>
        </Row>

        <Row>
          <Col span={GrenadesUsage.COL_SPAN}>HE</Col>
          <Col span={GrenadesUsage.COL_SPAN}>Thrown: {heThrown}</Col>
          <Col span={GrenadesUsage.COL_SPAN}>Total damage: {heDamage}</Col>
          <Col span={GrenadesUsage.COL_SPAN}>Success rate: {heSuccessRate}</Col>
        </Row>

        <Row>
          <Col span={GrenadesUsage.COL_SPAN}>Fire grenades</Col>
          <Col span={GrenadesUsage.COL_SPAN}>
            Thrown: {molotovsThrown + incendiariesThrown}
          </Col>
          <Col span={GrenadesUsage.COL_SPAN}>
            Total damage: {molotovsDamage}
          </Col>
          <Col span={GrenadesUsage.COL_SPAN}>
            Success rate: {fireSuccessRate}
          </Col>
        </Row>

        <Row>
          <Col span={GrenadesUsage.COL_SPAN}>Smokes</Col>
          <Col span={GrenadesUsage.COL_SPAN}>Thrown: {smokesThrown}</Col>
        </Row>
      </Flex>

      <Bar
        data={data}
        xField="type"
        yField="value"
        colorField="direction"
        stack={true}
        tooltip={false}
        scale={{
          y: { domainMin: -1, domainMax: 1 },
          color: { range: ["#52c41a", "#ff4d4f"] },
        }}
        axis={{
          y: {
            labelFormatter: (v: number) => Math.abs(v).toFixed(2),
          },
        }}
        label={{
          text: (d: { value: number }) => Math.abs(d.value).toFixed(2),
          position: "inside",
        }}
      />
    </div>
  );
};
GrenadesUsage.COL_SPAN = 4;
