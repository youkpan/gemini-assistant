import { Flex, Link, Text } from "@radix-ui/themes";
import {
  EnvelopeOpenIcon,
  GitHubLogoIcon,
  LinkedInLogoIcon,
  TwitterLogoIcon,
} from "@radix-ui/react-icons";
import useResponsive from "@/hooks/useResponsive";
import {switchCamera,videoRef,SelectDesktop} from "@/hooks/useApp"

const Links = () => {
  const { isMobile } = useResponsive();
  return (
    <Flex
      position={"absolute"}
      gap={"2"}
      align={"center"}
      className={`z-50 ${isMobile ? " w-full top-0 left-[-4px]" : "right-16"}`}
      style={isMobile ? { placeContent: "center" } : {}}
    >
      <Link
        href={"https://ai.zyinfo.pro/?from=github"}
        target="_blank"
        rel="me noopener noreferrer"
      >
        <Text size={"4"} className="text-black text-center">
        ai.zyinfo.pro
        </Text>
      </Link>
      <button style={{color:"#000"}} onClick={async ()=>{ await switchCamera()}} >Switch camera </button>
      <button style={{color:"#000"}} onClick={async ()=>{ await SelectDesktop()}} >use screen </button>
    </Flex>
  );
};

export default Links;
