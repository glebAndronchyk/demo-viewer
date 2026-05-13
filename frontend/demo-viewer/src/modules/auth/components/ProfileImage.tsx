import { ProfileImage as UIProfileImage } from "../../../components/ProfileImage";
import { Link } from "react-router";
import type { AuthUser } from "../AuthContext.tsx";
import { Typography } from "antd";

interface ProfileImageProps {
  user: AuthUser;
}

export const ProfileImage = (props: ProfileImageProps) => {
  return (
    <UIProfileImage
      options={[
        {
          key: "account",
          label: <Link to="/account">{props.user.steamId}</Link>,
        },
        {
          key: "groups",
          label: <Link to="/groups">Groups</Link>,
        },
      ]}
    >
      <Typography.Text className="pr-2">{props.user.steamId}</Typography.Text>
    </UIProfileImage>
  );
};
