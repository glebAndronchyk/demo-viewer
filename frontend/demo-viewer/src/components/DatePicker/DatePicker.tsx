import dateFnsGenerateConfig from "@rc-component/picker/generate/dateFns";
import { DatePicker } from "antd";

const MyDatePicker = DatePicker.generatePicker<Date>(dateFnsGenerateConfig);

export default MyDatePicker;
