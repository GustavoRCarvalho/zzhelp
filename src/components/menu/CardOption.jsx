import { motion } from "framer-motion"
import styled from "styled-components"
import { GiOpenBook } from "react-icons/gi"
import { NoStyleLinkRouter } from "../../router/NoStyleLinkRouter"

export const CardOption = ({ categoryTitle, subCategories }) => {
  return (
    <Card>
      {subCategories.map(({ title }, index) => (
        <NoStyleLinkRouter key={title + index} to={categoryTitle + title}>
          <Title>
            <GiOpenBook />
            {title}
          </Title>
        </NoStyleLinkRouter>
      ))}
    </Card>
  )
}

const Title = styled(motion.span)`
  display: flex;
  gap: 0.5em;

  &:hover {
    color: var(--side-menu-item-select);
  }

  border-radius: 5px;

  transition: color 0.2s;
`

const Card = styled(motion.div)`
  position: absolute;

  display: flex;
  flex-direction: column;
  align-items: start;
  justify-content: space-between;
  font-size: 0.9em;

  top: 0;
  left: 100%;

  width: max-content;

  padding: 1em;
  gap: 0.8em;
  border-radius: 5px;

  background-color: var(--side-menu-background);
  color: var(--side-menu-color);

  box-shadow: -0.25em 0.25em 1em 0.1em black;
  z-index: 1;

  svg {
    width: 1.45em;
    height: 1.45em;
  }
`
