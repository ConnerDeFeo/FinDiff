import FindiffDropDown from "../../../common/component/display/FindiffDropDown";
import { ImportantSections, Sections } from "../../../common/variables/Sections";

const SectionSelection = ({ selectedSection, setSelectedSection }:
    {
        selectedSection: string, 
        setSelectedSection: React.Dispatch<React.SetStateAction<string>>
    }
) => {
    const convertSectionKeyToDisplay = (key: string) => {
        return key.replace(/_/g, ' ').replace(/^\w/, c => c.toUpperCase());
    }
    return(
        <FindiffDropDown
            label="Section to View (Optional)"
            options={Object.values(Sections).map(section => convertSectionKeyToDisplay(section))}
            value={selectedSection ? convertSectionKeyToDisplay(selectedSection) : ''}
            onChange={(value) => {
                const section = Object.values(Sections).find(s => convertSectionKeyToDisplay(s) === value);
                if (section) setSelectedSection(section);
            }}
            placeholder="Select a section"
            openUpward
            specialOptions={new Set(ImportantSections.map(section => convertSectionKeyToDisplay(section)))}
        />
    );
};

export default SectionSelection;