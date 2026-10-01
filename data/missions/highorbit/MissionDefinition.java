package data.missions.highorbit;

import com.fs.starfarer.api.fleet.FleetGoal;
import com.fs.starfarer.api.fleet.FleetMemberType;
import com.fs.starfarer.api.impl.campaign.ids.StarTypes;
import com.fs.starfarer.api.mission.FleetSide;
import com.fs.starfarer.api.mission.MissionDefinitionAPI;
import com.fs.starfarer.api.mission.MissionDefinitionPlugin;

public class MissionDefinition implements MissionDefinitionPlugin {

	public void defineMission(MissionDefinitionAPI api) {

		// Set up the fleets
		api.initFleet(FleetSide.PLAYER, "DNS", FleetGoal.ATTACK, false);
		api.initFleet(FleetSide.ENEMY, "HSS", FleetGoal.ATTACK, true);

		// Fleet taglines from the narrative
		api.setFleetTagline(FleetSide.PLAYER, "August 元帅的打击舰队");
		api.setFleetTagline(FleetSide.ENEMY, "霸主检察舰队战斗群");

		// Briefing items - tactical objectives
		api.addBriefingItem("捍卫德拉科尼斯自由运用 AI 核心的权利");
		api.addBriefingItem("取得决定性胜利，震慑霸主未来的干涉");

		// Set up the player's fleet - Draconis Strike Fleet
        // Flagship
        api.addToFleet(FleetSide.PLAYER, "XLII_altais_Elite", FleetMemberType.SHIP, "Kori 之怒", true);

        // Capital ships
        api.addToFleet(FleetSide.PLAYER, "XLII_dziban_Elite", FleetMemberType.SHIP, "无形坚忍", false);
        api.addToFleet(FleetSide.PLAYER, "XLII_alwaid_Elite", FleetMemberType.SHIP, "使徒信经", false);

        // Cruiser line
        api.addToFleet(FleetSide.PLAYER, "XLII_eltanin_Elite", FleetMemberType.SHIP, "坚定决心", false);
        api.addToFleet(FleetSide.PLAYER, "XLII_juni_Elite", FleetMemberType.SHIP, "不屈", false);
        api.addToFleet(FleetSide.PLAYER, "XLII_juza_Elite", FleetMemberType.SHIP, "擎天", false);

        // Destroyer screen
		api.addToFleet(FleetSide.PLAYER, "XLII_giausar_Elite", FleetMemberType.SHIP, "铁幕", false);
		api.addToFleet(FleetSide.PLAYER, "XLII_errakis_Elite", FleetMemberType.SHIP, "复仇", false);
        api.addToFleet(FleetSide.PLAYER, "XLII_rastaban_Elite", FleetMemberType.SHIP, "加尔各答", false);
        api.addToFleet(FleetSide.PLAYER, "XLII_shaobi_Elite", FleetMemberType.SHIP, "霹雳", false);

		// Fast frigate support
        api.addToFleet(FleetSide.PLAYER, "XLII_alruba_Elite", FleetMemberType.SHIP, "迅捷正义", false);
        api.addToFleet(FleetSide.PLAYER, "XLII_alruba_mk2_Elite", FleetMemberType.SHIP, "夜色深沉", false);
        api.addToFleet(FleetSide.PLAYER, "XLII_thuban_Elite", FleetMemberType.SHIP, "你觉得走运吗？", false);

		// Set up the enemy fleet - Hegemony Compliance Battlegroup
		// Flagship
		api.addToFleet(FleetSide.ENEMY, "onslaught_Elite", FleetMemberType.SHIP, "霸主之志", false);

        // Capital ships
        api.addToFleet(FleetSide.ENEMY, "legion_Strike", FleetMemberType.SHIP, "巴比伦", false);
        api.addToFleet(FleetSide.ENEMY, "legion_Strike", FleetMemberType.SHIP, "吾等全部希望", false);

		// Cruiser line
		api.addToFleet(FleetSide.ENEMY, "dominator_Assault", FleetMemberType.SHIP, "约瑟", false);
        api.addToFleet(FleetSide.ENEMY, "dominator_Assault", FleetMemberType.SHIP, "执法者", false);
        api.addToFleet(FleetSide.ENEMY, "eagle_Assault", FleetMemberType.SHIP, "航行者", false);
        api.addToFleet(FleetSide.ENEMY, "eagle_Assault", FleetMemberType.SHIP, "家外之家", false);
		api.addToFleet(FleetSide.ENEMY, "falcon_Attack", FleetMemberType.SHIP, "遵从", false);
		api.addToFleet(FleetSide.ENEMY, "falcon_Attack", FleetMemberType.SHIP, "威权", false);

		// Destroyer screen
		api.addToFleet(FleetSide.ENEMY, "hammerhead_Balanced", FleetMemberType.SHIP, "天罚", false);
        api.addToFleet(FleetSide.ENEMY, "hammerhead_Balanced", FleetMemberType.SHIP, "皓潮", false);
		api.addToFleet(FleetSide.ENEMY, "enforcer_Balanced", FleetMemberType.SHIP, "律法者", false);
		api.addToFleet(FleetSide.ENEMY, "sunder_Assault", FleetMemberType.SHIP, "风暴", false);

		// Picket frigates
		api.addToFleet(FleetSide.ENEMY, "lasher_CS", FleetMemberType.SHIP, "警醒", false);
		api.addToFleet(FleetSide.ENEMY, "wolf_CS", FleetMemberType.SHIP, "守望者", false);

		// Set up the map - Kori High Orbit
		float width = 10000f;
		float height = 10000f;
		api.initMap((float)-width/2f, (float)width/2f, (float)-height/2f, (float)height/2f);

		float minX = -width/2;
		float minY = -height/2;

		// Add planet in center - Kori (frozen moon)
		// Scaled up from campaign size (40f) for mission visibility
		api.addPlanet(0, 0, 250f, "frozen", 0f, false);

		// Add asteroid/debris field for tactical cover
		// Positioned to the side, not blocking main engagement area
		api.addAsteroidField(minX + 3000, minY + height / 2, 45, 6000f, 20f, 70f, 40);

		// Additional smaller debris field
		api.addAsteroidField(minX + width - 4000, minY + height / 2, -30, 5000f, 15f, 60f, 20);
	}
}